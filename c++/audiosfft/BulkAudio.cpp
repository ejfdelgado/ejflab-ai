#include <stdio.h>
#include <string.h>
#include <portaudio.h>
#include <string>
#include <stdint.h>
#include <unistd.h>

#include "Audiosfft.h"
#include "audio.h"
#include "utils.h"

#include <iostream>
#include <string>

#define CHECK(x)                                                                \
    {                                                                           \
        if (!(x))                                                               \
        {                                                                       \
            fprintf(stderr, "%s:%i: failure at: %s\n", __FILE__, __LINE__, #x); \
            _exit(1);                                                           \
        }                                                                       \
    }

PaStream *stream;
FILE *wavfile;
int numChannels;
int sampleRate;
PaSampleFormat sampleFormat;
int bytesPerSample, bitsPerSample;
UserAudioData audioData;

int paStreamCallback(
    const void *input, void *output,
    unsigned long frameCount,
    const PaStreamCallbackTimeInfo *timeInfo,
    PaStreamCallbackFlags statusFlags,
    void *userData)
{
    unsigned int i;
    UserAudioData *data = (UserAudioData *)userData;
    size_t numRead = fread(output, bytesPerSample * numChannels, frameCount, wavfile);

    const __int16_t *rptr = (const __int16_t *)output;

    // Copy from one side to another
    unsigned long startingPoint = data->startingPoint;
    SAMPLE *wptr = &(data->line[startingPoint]);

    for (i = 0; i < frameCount; i++)
    {
        // Este valor va de cero a 255
        const __int16_t value = *rptr++;
        // std::cout << value << std::endl;
        float converted = ((float)value); // -1 y 1
        //converted = (ceil(converted / 2));
        // converted -= 0.5; // -0.5 y 0.5
        //converted *= 0.01;
        converted *= 0.001;

        // float converted = ((float)value); // 0-1
        *wptr++ = converted;
        //*wptr++ = ((float)value);
    }

    data->startingPoint += numRead;

    frameCount -= numRead; // Es igual siempre excepto la última vez
    if (frameCount > 0)
    {
        // Rellena con ceros
        output = (uint8_t *)output + numRead * numChannels * bytesPerSample;
        memset(output, 0, frameCount * numChannels * bytesPerSample);
        return paComplete;
    }

    return paContinue;
}

bool portAudioOpen(json *inputData, UserAudioData *data)
{
    CHECK(Pa_Initialize() == paNoError);

    PaStreamParameters outputParameters;

    outputParameters.device = Pa_GetDefaultOutputDevice();
    CHECK(outputParameters.device != paNoDevice);

    outputParameters.hostApiSpecificStreamInfo = NULL;
    outputParameters.channelCount = numChannels;
    outputParameters.sampleFormat = sampleFormat;
    outputParameters.suggestedLatency = Pa_GetDeviceInfo(outputParameters.device)->defaultHighOutputLatency;

    // Prepare user buffer
    unsigned int numSamples = floor((float)(*inputData)["SECONDS"] * sampleRate);
    int numBytes = numSamples * sizeof(SAMPLE);
    std::cout << "Buffer has " << numBytes << " bytes with " << numSamples << " samples" << std::endl;
    audioData.startingPoint = 0;
    audioData.maxSize = numSamples;
    audioData.maxGap = numSamples; // Esto hizo que otro valor diera cero en el log
    std::cout << "maxGap: " << audioData.maxGap << std::endl;
    audioData.line = (SAMPLE *)malloc(numBytes);
    for (unsigned int i = 0; i < numSamples; i++)
    {
        audioData.line[i] = 0;
    }

    PaError ret = Pa_OpenStream(
        &stream,
        NULL, // no input
        &outputParameters,
        sampleRate,
        paFramesPerBufferUnspecified, // framesPerBuffer
        0,                            // flags
        &paStreamCallback,
        data // void *userData
    );

    if (ret != paNoError)
    {
        fprintf(stderr, "Pa_OpenStream failed: (err %i) %s\n", ret, Pa_GetErrorText(ret));
        if (stream)
            Pa_CloseStream(stream);
        return false;
    }

    CHECK(Pa_StartStream(stream) == paNoError);
    return true;
}

std::string freadStr(FILE *f, size_t len)
{
    std::string s(len, '\0');
    CHECK(fread(&s[0], 1, len, f) == len);
    return s;
}

template <typename T>
T freadNum(FILE *f)
{
    T value;
    CHECK(fread(&value, sizeof(value), 1, f) == 1);
    return value; // no endian-swap for now... WAV is LE anyway...
}

void readFmtChunk(uint32_t chunkLen)
{
    CHECK(chunkLen >= 16);
    uint16_t fmttag = freadNum<uint16_t>(wavfile); // 1: PCM (int). 3: IEEE float
    CHECK(fmttag == 1 || fmttag == 3);
    numChannels = freadNum<uint16_t>(wavfile);
    CHECK(numChannels > 0);
    printf("%i channels\n", numChannels);
    sampleRate = freadNum<uint32_t>(wavfile);
    printf("%i Hz\n", sampleRate);
    uint32_t byteRate = freadNum<uint32_t>(wavfile);
    uint16_t blockAlign = freadNum<uint16_t>(wavfile);
    bitsPerSample = freadNum<uint16_t>(wavfile);
    bytesPerSample = bitsPerSample / 8;
    CHECK(byteRate == sampleRate * numChannels * bytesPerSample);
    CHECK(blockAlign == numChannels * bytesPerSample);
    if (fmttag == 1 /*PCM*/)
    {
        switch (bitsPerSample)
        {
        case 8:
            sampleFormat = paInt8;
            break;
        case 16:
            sampleFormat = paInt16;
            break;
        case 32:
            sampleFormat = paInt32;
            break;
        default:
            CHECK(false);
        }
        printf("PCM %ibit int\n", bitsPerSample);
    }
    else
    {
        CHECK(fmttag == 3 /* IEEE float */);
        CHECK(bitsPerSample == 32);
        sampleFormat = paFloat32;
        printf("32bit float\n");
    }
    if (chunkLen > 16)
    {
        uint16_t extendedSize = freadNum<uint16_t>(wavfile);
        CHECK(chunkLen == 18 + extendedSize);
        fseek(wavfile, extendedSize, SEEK_CUR);
    }
}

int main(int argc, char **argv)
{

    cv::CommandLineParser parser(argc, argv,
                                 "{@config   i|../data/example.json|config json file}"
                                 "{@wav   o|../data/recorded/mono.wav|wav file}");
    parser.printMessage();
    std::string configFilePath = parser.get<cv::String>("@config");
    std::string wavFilePath = parser.get<cv::String>("@wav");
    std::string fileContent = readTextFile(configFilePath);
    json inputData = json::parse(fileContent);

    wavfile = fopen(wavFilePath.c_str(), "r");
    CHECK(wavfile != NULL);

    CHECK(freadStr(wavfile, 4) == "RIFF");
    uint32_t wavechunksize = freadNum<uint32_t>(wavfile);
    CHECK(freadStr(wavfile, 4) == "WAVE");
    while (true)
    {
        std::string chunkName = freadStr(wavfile, 4);
        uint32_t chunkLen = freadNum<uint32_t>(wavfile);
        if (chunkName == "fmt ")
            readFmtChunk(chunkLen);
        else if (chunkName == "data")
        {
            CHECK(sampleRate != 0);
            CHECK(numChannels > 0);
            CHECK(bytesPerSample > 0);
            printf("len: %.0f secs\n", double(chunkLen) / sampleRate / numChannels / bytesPerSample);
            break; // start playing now
        }
        else
        {
            // skip chunk
            CHECK(fseek(wavfile, chunkLen, SEEK_CUR) == 0);
        }
    }

    printf("start playing...\n");
    CHECK(portAudioOpen(&inputData, &audioData));

    // wait until stream has finished playing
    while (Pa_IsStreamActive(stream) > 0)
        usleep(1000);

    // Create images for dft
    unsigned int numSamples = floor((float)inputData["SECONDS"] * sampleRate);
    std::cout << "numSamples: " << numSamples << std::endl;

    // Al leer de una audio, esto debe ser el largo del audio
    unsigned int WINDOW_DFT = floor((float)inputData["WINDOW_DFT_SECONS"] * sampleRate);
    // unsigned int WINDOW_DFT = audioData.maxGap;
    //  Force to be the closest even number...
    WINDOW_DFT = round(WINDOW_DFT / 2) * 2;
    std::cout << "WINDOW_DFT: " << WINDOW_DFT << std::endl;
    cv::Mat baseDft = createBaseDft(WINDOW_DFT);
    cv::Mat planes1 = cv::Mat::zeros(baseDft.size(), CV_32F);
    cv::Mat planes0 = cv::Mat_<float>(baseDft);
    unsigned int dftWidth = (audioData.maxGap - WINDOW_DFT) / (float)(baseDft.rows / 2);
    std::cout << "dftWidth: " << dftWidth << std::endl;
    cv::Mat *spectrogram = new cv::Mat(inputData["DFT_HEIGHT"], dftWidth, CV_32F, cv::Scalar::all(0));
    cv::Mat *cm_spectrogram = new cv::Mat(inputData["DFT_HEIGHT"], dftWidth, CV_8UC3, cv::Scalar(0, 0, 0));

    audioData.gapReady = true;
    std::cout << "computeDft..." << std::endl;
    audioData.maxGap = (baseDft.rows / 2);
    unsigned int maxSize = audioData.startingPoint;
    unsigned int increments = audioData.maxGap;

    while (increments < (maxSize - audioData.maxGap))
    {
        audioData.maxSize = increments;
        audioData.gapReady = true;
        computeDft(&baseDft, &audioData, &inputData, spectrogram, cm_spectrogram, &planes0, &planes1);
        increments += audioData.maxGap;
    }
    cv::Mat gray = createGrayScaleImage(sizeof(IMAGE_MAT_TYPE) * 256, inputData["DISPLAY_WIDTH"], 0);
    printAudioOnImage(&gray, &audioData, &inputData);
    std::cout << "showSTFT..." << std::endl;
    showImage(&gray);
    showSTFT(cm_spectrogram);
    while (cv::waitKey(1) != 113)
        ;

    printf("finished\n");
    fclose(wavfile);
    Pa_CloseStream(stream);
    Pa_Terminate();
    free(audioData.line);
}
