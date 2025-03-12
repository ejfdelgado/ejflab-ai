#include <iostream>
#include <libfreenect2/logger.h>
#include <libfreenect2/libfreenect2.hpp>
#include <libfreenect2/frame_listener_impl.h>
#include <linux/videodev2.h>
#include <sys/ioctl.h>
#include <unistd.h>
#include <fcntl.h>
#include <thread>
#include "kinect2pipe.h"
extern "C" {
    #include <libswscale/swscale.h>
    #include <sys/inotify.h>
}
using namespace std;
using namespace libfreenect2;

Kinect2Pipe::Kinect2Pipe () {
    this->sws = sws_getContext(
        KINECT2_IMAGE_WIDTH, //	the width of the source image
        KINECT2_IMAGE_HEIGHT, // the height of the source image
        AV_PIX_FMT_RGB32, // the source image format
        //AV_PIX_FMT_GRAY16,
        OUTPUT_WIDTH, // the width of the destination image
        OUTPUT_HEIGHT, // the height of the destination image
        AV_PIX_FMT_YUV420P, // the destination image format
        SWS_BILINEAR, // specify which algorithm and options to use for rescaling
        nullptr, 
        nullptr, 
        nullptr);
    memset(this->srcPtr, 0, sizeof(uint8_t*) * 4);
    this->srcStride[0] = KINECT2_IMAGE_WIDTH*4;
    this->srcStride[1] = 0;
    this->srcStride[2] = 0;
    this->srcStride[3] = 0;

    this->tempBuffer = (uint8_t*)calloc(1, YUV_BUFFER_Y_LEN * 4);
    this->imageBuffer = (uint8_t*)calloc(1, YUV_BUFFER_LEN);
    this->dstPtr[0] = this->imageBuffer;
    this->dstPtr[1] = this->imageBuffer + YUV_BUFFER_Y_LEN;
    this->dstPtr[2] = this->imageBuffer + YUV_BUFFER_Y_LEN + YUV_BUFFER_UV_LEN;
    this->dstPtr[3] = nullptr;
    this->dstStride[0] = OUTPUT_WIDTH;
    this->dstStride[1] = OUTPUT_WIDTH/2;
    this->dstStride[2] = OUTPUT_WIDTH/2;
    this->dstStride[3] = 0;

    this->v4l2Device = 0;
    this->inotifyFd = 0;
    this->watcherFd = 0;
    this->openCount = 0;
    this->started = false;

    libfreenect2::setGlobalLogger(nullptr);
}

void Kinect2Pipe::openLoopback(const char *loopbackDev) {
    if (!this->openV4L2LoopbackDevice(loopbackDev, OUTPUT_WIDTH, OUTPUT_HEIGHT)) {
        exit(1);
    }
    this->writeBlankFrame();
    if (!this->openWatchV4L2LoopbackDevice(loopbackDev)) {
        exit(1);
    }
}

bool Kinect2Pipe::openV4L2LoopbackDevice(const char* loopbackDev, int width, int height) {
    this->v4l2Device = open(loopbackDev, O_WRONLY);
    if (this->v4l2Device < 0) {
        cerr << "failed to open v4l2loopback device: " << errno << endl;
        return false;
    }
    struct v4l2_format fmt{};
    fmt.type = V4L2_BUF_TYPE_VIDEO_OUTPUT;
    fmt.fmt.pix.width = width;
    fmt.fmt.pix.height = height;
    fmt.fmt.pix.pixelformat = V4L2_PIX_FMT_YUV420;
    fmt.fmt.pix.sizeimage = fmt.fmt.pix.width * fmt.fmt.pix.height * 1.5;
    fmt.fmt.pix.field = V4L2_FIELD_NONE;
    fmt.fmt.pix.bytesperline = fmt.fmt.pix.width;
    fmt.fmt.pix.colorspace = V4L2_COLORSPACE_SRGB;

    if (ioctl(this->v4l2Device, VIDIOC_S_FMT, &fmt) < 0) {
        cerr << "failed to issue ioctl to v4l2loopback device: " << errno << endl;
        return false;
    }

    return true;
}

bool Kinect2Pipe::openKinect2Device() {
    bool enable_rgb = true;
    bool enable_depth = true;
    int types = 0;
    if (enable_rgb)
        types |= libfreenect2::Frame::Color;
    if (enable_depth)
        types |= libfreenect2::Frame::Ir | libfreenect2::Frame::Depth;
    SyncMultiFrameListener listener(types);
    Freenect2Device *dev;
    if (freenect2.enumerateDevices() == 0) {
        cerr << "unable to find a kinect2 device to connect to" << endl;
        return false;
    }
    dev = freenect2.openDefaultDevice();
    dev->setIrAndDepthFrameListener(&listener);
    dev->setColorFrameListener(&listener);
    if (!dev->startStreams(enable_rgb, enable_depth)) {
        cerr << "unable to start kinect2 rgb stream" << endl;
        return false;
    }

    libfreenect2::Registration* registration = new libfreenect2::Registration(dev->getIrCameraParams(), dev->getColorCameraParams());
    libfreenect2::Frame undistorted(512, 424, 4), registered(512, 424, 4);

    long count = 0;
    while (this->started) {
        if (!listener.waitForNewFrame(frames, 2000)) {
            cerr << "timeout waiting for frame" << endl;
            return false;
        }

        libfreenect2::Frame *rgb = frames[libfreenect2::Frame::Color];
        libfreenect2::Frame *ir = frames[libfreenect2::Frame::Ir];
        libfreenect2::Frame *depth = frames[libfreenect2::Frame::Depth];

        registration->apply(rgb, depth, &undistorted, &registered);
        if (!this->handleDeepFrame(depth)) {
            return false;
        }

        listener.release(frames);
        count++;
    }
    this->writeBlankFrame();
    dev->stop();
    dev->close();
    return true;
}

void Kinect2Pipe::HSVtoRGB(float H, float S,float V, uint8_t* output) {
    if(H>360 || H<0 || S>100 || S<0 || V>100 || V<0){
        cout<<"The givem HSV values are not in valid range"<<endl;
        return;
    }
    float s = S/100;
    float v = V/100;
    float C = s*v;
    float X = C*(1-abs(fmod(H/60.0, 2)-1));
    float m = v-C;
    float r,g,b;
    if(H >= 0 && H < 60){
        r = C,g = X,b = 0;
    }
    else if(H >= 60 && H < 120){
        r = X,g = C,b = 0;
    }
    else if(H >= 120 && H < 180){
        r = 0,g = C,b = X;
    }
    else if(H >= 180 && H < 240){
        r = 0,g = X,b = C;
    }
    else if(H >= 240 && H < 300){
        r = X,g = 0,b = C;
    }
    else{
        r = C,g = 0,b = X;
    }
    output[2] = (r+m)*255;
    output[1] = (g+m)*255;
    output[0] = (b+m)*255;
}

bool Kinect2Pipe::handleDeepFrame(Frame* frame) {
    
    uint8_t* temp = frame->data;
    //512x424 float A 4-byte float per pixel
    unsigned int totalFloats = 512 * 424;
    for (int i=0; i<totalFloats; i++) {
        uint8_t* current = temp + 4*i;
        float val = *(float*)current;
        //uint8_t actual = 1024*val/65536;
        //uint8_t actual = val/64;
        float actual = 3*360*val/64/256;
        //uint8_t actual = 255;

        this->HSVtoRGB(actual, 100, 100, &this->tempBuffer[4*i]);
        this->tempBuffer[4*i+3] = 0;
    }
    
    this->srcPtr[0] = this->tempBuffer;
    sws_scale(this->sws, this->srcPtr, this->srcStride, 0, KINECT2_IMAGE_HEIGHT, this->dstPtr, this->dstStride);
    return write(this->v4l2Device, this->imageBuffer, YUV_BUFFER_LEN) > 0;
}

bool Kinect2Pipe::handleFrame(Frame* frame) {
    this->srcPtr[0] = frame->data;
    sws_scale(this->sws, this->srcPtr, this->srcStride, 0, KINECT2_IMAGE_HEIGHT, this->dstPtr, this->dstStride);
    return write(this->v4l2Device, this->imageBuffer, YUV_BUFFER_LEN) > 0;
}

bool Kinect2Pipe::openWatchV4L2LoopbackDevice(const char* loopbackDev) {
    this->inotifyFd = inotify_init();
    if (this->inotifyFd < 0) {
        cerr << "failed to initialize inotify watcher: " << errno << endl;
        return false;
    }
    this->watcherFd = inotify_add_watch(this->inotifyFd, loopbackDev, IN_OPEN|IN_CLOSE);
    if (this->watcherFd < 0) {
        cerr << "failed to initialize add inotify watcher on " << loopbackDev << ": " << errno << endl;
        return false;
    }
    this->watcherThread = thread (&Kinect2Pipe::watchV4L2LoopbackDevice, this);
    this->watcherThread.detach();
    return true;
}

void Kinect2Pipe::watchV4L2LoopbackDevice() {
    // We'll own the lock on this until we're ready to rumble.
    unique_lock<mutex> lk(this->startMutex);
    this->startCondition.wait(lk, [this]{ return !this->started; });
    this->drainInotifyEvents();
    inotify_event events[20];

    fd_set set;
    struct timeval timeout{10, 0};
    while (true) {
        FD_ZERO(&set);
        FD_SET(this->inotifyFd, &set);
        timeout.tv_sec = 10;
        int retr = select(this->inotifyFd + 1, &set, nullptr, nullptr, &timeout);
        if (retr < 0) {
            // error
            cout << "watcher select encountered an problem and quit" << endl;
            return;
        } else if (retr == 0) {
            if (this->openCount == 0 && this->started) {
                cout << "closing device since no one is watching" << endl;
                this->started = false;
                lk.lock();
            }
        } else {
            int len = read(this->inotifyFd, &events, sizeof(events));
            if (len <= 0) {
                cout << "watcher encountered an problem and quit" << endl;
                return;
            }
            for (int i = 0; i < (len / sizeof(inotify_event)); i++) {
                inotify_event *evt = &events[i];
                if (evt->mask & IN_OPEN) {
                    this->openCount++;
                    if (!this->started) {
                        this->started = true;
                        lk.unlock();
                        this->startCondition.notify_one();
                    }

                } else if (evt->mask & IN_CLOSE) {
                    this->openCount--;
                    if (this->openCount <= 0) {
                        this->openCount = 0;
                    }
                }
            }
        }
    }
}

void Kinect2Pipe::drainInotifyEvents() {
    fd_set set;
    struct timeval timeout{2, 0};
    inotify_event events[20];
    FD_ZERO(&set);
    FD_SET(this->inotifyFd, &set);
    while(true) {
        int retr = select(this->inotifyFd + 1, &set, nullptr, nullptr, &timeout);
        if (retr == -1) {
            return;
        } else if (retr == 0) {
            return;
        } else {
            read(this->inotifyFd, &events, sizeof(events));
        }
    }
}

void Kinect2Pipe::run() {
    while(true) {
        unique_lock<mutex> lk(this->startMutex);
        this->startCondition.wait(lk, [this]{ return this->started; });
        if (this->started) {
            cout << "device opened, starting capture" << endl;
            if (!this->openKinect2Device()) {
                exit(-1);
            }
            // If we get here we've shut down.
            lk.unlock();

            /* TODO: Fix this, there's a memory leak somewhere in libfreenect2 and we should be able to avoid it and not
             * have to bounce the process every time, but for now this is the cleaner way to do it and let systemd
             * restart us. */
            exit(0);
        }
    }
}

void Kinect2Pipe::writeBlankFrame() {
    memset(this->imageBuffer, 0x10, YUV_BUFFER_Y_LEN);
    memset(this->imageBuffer + YUV_BUFFER_Y_LEN, 0, YUV_BUFFER_UV_LEN * 2);
    write(this->v4l2Device, this->imageBuffer, YUV_BUFFER_LEN);
}
