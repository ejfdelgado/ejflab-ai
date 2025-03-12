
#ifndef __audios_h__
#define __audios_h__

#include <fstream>
#include "portaudio.h"
#include <stdio.h>
#include <nlohmann/json.hpp>

typedef float SAMPLE;
#define PA_SAMPLE_TYPE paFloat32

// typedef char SAMPLE;
// #define PA_SAMPLE_TYPE paUInt8

#define SAMPLE_RATE (44100)

using json = nlohmann::json;

typedef struct
{
    SAMPLE *line;
    unsigned long startingPoint;
    unsigned long maxSize;
    bool gapReady;
    unsigned long countGap;
    unsigned long maxGap;
} UserAudioData;
/* This routine will be called by the PortAudio engine when audio is needed.
 * It may called at interrupt level on some machines so don't do anything
 * that could mess up the system like calling malloc() or free().
 */
static int listeningAudioCallback(const void *inputBuffer, void *outputBuffer,
                                  unsigned long thisBufferSize,
                                  const PaStreamCallbackTimeInfo *timeInfo,
                                  PaStreamCallbackFlags statusFlags,
                                  void *userData)
{
    UserAudioData *data = (UserAudioData *)userData;
    (void)inputBuffer;
    (void)outputBuffer;
    int finished;
    unsigned int i;

    const SAMPLE *rptr = (const SAMPLE *)inputBuffer;
    // std::cout << thisBufferSize << std::endl;
    unsigned long startingPoint = data->startingPoint;
    unsigned long moveCount = 0;
    unsigned int loQueCabe = data->maxSize - startingPoint;
    unsigned int loQueTocaDescartar = 0;
    if (thisBufferSize > loQueCabe)
    {
        loQueTocaDescartar = thisBufferSize - loQueCabe;
        moveCount = data->maxSize - loQueTocaDescartar;
        SAMPLE *source = &(data->line[loQueTocaDescartar]);
        SAMPLE *destination = &(data->line[0]);
        for (i = 0; i < moveCount; i++)
        {
            *destination++ = *source++;
        }
        // Se hace el corrimiento a la izquierda
        // startingPoint = data->maxSize - thisBufferSize;
        startingPoint -= loQueTocaDescartar;
    }

    SAMPLE *wptr = &(data->line[startingPoint]);
    for (i = 0; i < thisBufferSize; i++)
    {
        *wptr++ = *rptr++;
    }
    if (data->countGap > data->maxGap)
    {
        if (!data->gapReady)
        {
            // Turn on flag
            data->gapReady = true;
        }
    }
    else
    {
        data->countGap += thisBufferSize;
    }
    data->startingPoint += loQueCabe;
    // finished = paComplete;
    finished = paContinue;
    //  finished = 0;
    return finished;
}

PaStream *sampleAudio(UserAudioData *data, PaStream *stream, PaStreamParameters *inputParameters, json *inputData)
{
    PaError err;
    inputParameters->channelCount = (*inputData)["channelCount"];
    std::cout << "inputParameters->channelCount = " << inputParameters->channelCount << std::endl;
    inputParameters->sampleFormat = PA_SAMPLE_TYPE;
    inputParameters->suggestedLatency = Pa_GetDeviceInfo(inputParameters->device)->defaultLowInputLatency;
    inputParameters->hostApiSpecificStreamInfo = NULL;

    unsigned long framsePerBuffer = (*inputData)["SAMPLED_FRAMES"];
    if (framsePerBuffer == 0)
    {
        framsePerBuffer = paFramesPerBufferUnspecified;
    }

    err = Pa_OpenStream(
        &stream,
        inputParameters,
        NULL, /* &outputParameters, */
        (*inputData)["SAMPLE_RATE"],
        framsePerBuffer,
        paClipOff,
        listeningAudioCallback,
        data);
    if (err != paNoError)
    {
        printf("Pa_OpenDefaultStream error: %s\n", Pa_GetErrorText(err));
        return NULL;
    }
    else
    {
        printf("Pa_OpenDefaultStream ok!\n");
    }

    err = Pa_StartStream(stream);
    if (err != paNoError)
    {
        printf("Pa_StartStream error: %s\n", Pa_GetErrorText(err));
        return NULL;
    }
    else
    {
        printf("Pa_StartStream ok: %p\n", stream);
        return stream;
    }
}

// saveWav("/home/acer/Masaüstü/kaydett.wav", &audioData, &inputData);
void saveWav(std::string path, UserAudioData *audioData, json *inputData)
{
    float val;
    SAMPLE *buffer = audioData->line;
    float maxValue = (*inputData)["MAX_AMPLITUD"];
    const unsigned int bufferSize = audioData->maxSize;
    unsigned int myDataSize = bufferSize * 2;
    char *myData = new char[myDataSize];
    // Se copia la señal de audio a la matriz
    for (int i = 0; i < bufferSize; i++)
    {
        val = buffer[i] / maxValue;
        if (val > 1)
        {
            val = 1;
        }
        else if (val < -1)
        {
            val = -1;
        }
        val = 65536 * (val + 1) / 2; // [0, 255] // NO
        //val = 256 * (val + 1) / 2; // [0, 255] // NO
        // val = 65536 * val; // [-255, 255]
        //  val = 512 * val; // [-255, 255]

        
        unsigned short val16 = (unsigned short)val;
        unsigned short part1 = val16 & 0xFF;
        unsigned short part2 = (val16 >> 8) & 0xFF;
        myData[2 * i] = (char)part1;
        myData[2 * i + 1] = (char)part2;
        std::cout << val << " | " << (unsigned short)val16 << " | " << part1 << " | " << part2 << std::endl;
        
        //myData[2 * i] = (char)part1;

    }

    int sampleRate = SAMPLE_RATE;

    int bitsPerSample = 16;

    int subchunk1size = 16;

    int numChannels = 1;

    std::cout << "myDataSize=" << myDataSize << std::endl;

    // int subchunk2size = numSamples * numChannels * bitsPerSample/8;
    int subchunk2size = myDataSize * numChannels;

    int chunksize = 36 + subchunk2size;

    int audioFormat = 1;

    int temp1 = bitsPerSample / 8;
    // temp1 = sizeof(short);

    int byteRate = sampleRate * numChannels * temp1;

    int blockAlign = numChannels * temp1;

    std::fstream myFile(path.c_str(), std::ios::out | std::ios::binary);

    myFile.seekp(0, std::ios::beg);
    myFile.write("RIFF", 4);
    myFile.write((char *)&chunksize, 4); // 0
    myFile.write("WAVE", 4);
    myFile.write("fmt ", 4);
    myFile.write((char *)&subchunk1size, 4); // 16=
    myFile.write((char *)&audioFormat, 2);   // 1=
    myFile.write((char *)&numChannels, 2);   // 1
    myFile.write((char *)&sampleRate, 4);    // 44100

    myFile.write((char *)&byteRate, 4);

    myFile.write((char *)&blockAlign, 2);

    myFile.write((char *)&bitsPerSample, 2); // 16
    myFile.write("data", 4);
    // myFile.write( (char*) &myDataSize, 4 );
    myFile.write((char *)&subchunk2size, 4);
    myFile.write(myData, myDataSize);
    myFile.close();

    delete[] myData;
}

bool initializeAudio()
{
    PaError err = Pa_Initialize();
    if (err != paNoError)
    {
        printf("Pa_Initialize error: %s\n", Pa_GetErrorText(err));
        return false;
    }
    return true;
}

bool terminateAudio(PaStream *stream)
{
    PaError err;
    if (stream != NULL)
    {
        err = Pa_CloseStream(stream);
        if (err != paNoError)
        {
            printf("Pa_CloseStream error: %p %s\n", stream, Pa_GetErrorText(err));
            return false;
        }
    }
    err = Pa_Terminate();
    if (err != paNoError)
    {
        printf("Pa_Terminate error: %s\n", Pa_GetErrorText(err));
        return false;
    }
    return true;
}

static void PrintSupportedStandardSampleRates(
    const PaStreamParameters *inputParameters,
    const PaStreamParameters *outputParameters)
{
    static double standardSampleRates[] = {
        8000.0, 9600.0, 11025.0, 12000.0, 16000.0, 22050.0, 24000.0, 32000.0,
        44100.0, 48000.0, 88200.0, 96000.0, 192000.0, -1 /* negative terminated  list */
    };
    int i, printCount;
    PaError err;

    printCount = 0;
    for (i = 0; standardSampleRates[i] > 0; i++)
    {
        err = Pa_IsFormatSupported(inputParameters, outputParameters, standardSampleRates[i]);
        if (err == paFormatIsSupported)
        {
            if (printCount == 0)
            {
                printf("\t%8.2f", standardSampleRates[i]);
                printCount = 1;
            }
            else if (printCount == 4)
            {
                printf(",\n\t%8.2f", standardSampleRates[i]);
                printCount = 1;
            }
            else
            {
                printf(", %8.2f", standardSampleRates[i]);
                ++printCount;
            }
        }
    }
    if (!printCount)
        printf("None\n");
    else
        printf("\n");
}

void displayAudioDevices()
{
    int i, numDevices, defaultDisplayed;
    const PaDeviceInfo *deviceInfo;
    PaStreamParameters inputParameters, outputParameters;
    PaError err;
    numDevices = Pa_GetDeviceCount();
    if (numDevices < 0)
    {
        printf("ERROR: Pa_GetDeviceCount returned 0x%x\n", numDevices);
        return;
    }
    std::cout << "numDevices = " << numDevices << std::endl;

    for (i = 0; i < numDevices; i++)
    {
        deviceInfo = Pa_GetDeviceInfo(i);
        printf("--------------------------------------- device #%d\n", i);

        /* Mark global and API specific default devices */
        defaultDisplayed = 0;
        if (i == Pa_GetDefaultInputDevice())
        {
            printf("[ Default Input");
            defaultDisplayed = 1;
        }
        else if (i == Pa_GetHostApiInfo(deviceInfo->hostApi)->defaultInputDevice)
        {
            const PaHostApiInfo *hostInfo = Pa_GetHostApiInfo(deviceInfo->hostApi);
            printf("[ Default %s Input", hostInfo->name);
            defaultDisplayed = 1;
        }

        if (i == Pa_GetDefaultOutputDevice())
        {
            printf((defaultDisplayed ? "," : "["));
            printf(" Default Output");
            defaultDisplayed = 1;
        }
        else if (i == Pa_GetHostApiInfo(deviceInfo->hostApi)->defaultOutputDevice)
        {
            const PaHostApiInfo *hostInfo = Pa_GetHostApiInfo(deviceInfo->hostApi);
            printf((defaultDisplayed ? "," : "["));
            printf(" Default %s Output", hostInfo->name);
            defaultDisplayed = 1;
        }

        if (defaultDisplayed)
            printf(" ]\n");

            /* print device info fields */
#ifdef WIN32
        { /* Use wide char on windows, so we can show UTF-8 encoded device names */
            wchar_t wideName[MAX_PATH];
            MultiByteToWideChar(CP_UTF8, 0, deviceInfo->name, -1, wideName, MAX_PATH - 1);
            wprintf(L"Name                        = %s\n", wideName);
        }
#else
        printf("Name                        = %s\n", deviceInfo->name);
#endif
        printf("Host API                    = %s\n", Pa_GetHostApiInfo(deviceInfo->hostApi)->name);
        printf("Max inputs = %d", deviceInfo->maxInputChannels);
        printf(", Max outputs = %d\n", deviceInfo->maxOutputChannels);

        printf("Default low input latency   = %8.4f\n", deviceInfo->defaultLowInputLatency);
        printf("Default low output latency  = %8.4f\n", deviceInfo->defaultLowOutputLatency);
        printf("Default high input latency  = %8.4f\n", deviceInfo->defaultHighInputLatency);
        printf("Default high output latency = %8.4f\n", deviceInfo->defaultHighOutputLatency);

#ifdef WIN32
#if PA_USE_ASIO
        /* ASIO specific latency information */
        if (Pa_GetHostApiInfo(deviceInfo->hostApi)->type == paASIO)
        {
            long minLatency, maxLatency, preferredLatency, granularity;

            err = PaAsio_GetAvailableLatencyValues(i,
                                                   &minLatency, &maxLatency, &preferredLatency, &granularity);

            printf("ASIO minimum buffer size    = %ld\n", minLatency);
            printf("ASIO maximum buffer size    = %ld\n", maxLatency);
            printf("ASIO preferred buffer size  = %ld\n", preferredLatency);

            if (granularity == -1)
                printf("ASIO buffer granularity     = power of 2\n");
            else
                printf("ASIO buffer granularity     = %ld\n", granularity);
        }
#endif /* PA_USE_ASIO */
#endif /* WIN32 */

        printf("Default sample rate         = %8.2f\n", deviceInfo->defaultSampleRate);

        /* poll for standard sample rates */
        inputParameters.device = i;
        inputParameters.channelCount = deviceInfo->maxInputChannels;
        inputParameters.sampleFormat = paInt16;
        inputParameters.suggestedLatency = 0; /* ignored by Pa_IsFormatSupported() */
        inputParameters.hostApiSpecificStreamInfo = NULL;

        outputParameters.device = i;
        outputParameters.channelCount = deviceInfo->maxOutputChannels;
        outputParameters.sampleFormat = paInt16;
        outputParameters.suggestedLatency = 0; /* ignored by Pa_IsFormatSupported() */
        outputParameters.hostApiSpecificStreamInfo = NULL;

        if (inputParameters.channelCount > 0)
        {
            printf("Supported standard sample rates\n for half-duplex 16 bit %d channel input = \n",
                   inputParameters.channelCount);
            PrintSupportedStandardSampleRates(&inputParameters, NULL);
        }

        if (outputParameters.channelCount > 0)
        {
            printf("Supported standard sample rates\n for half-duplex 16 bit %d channel output = \n",
                   outputParameters.channelCount);
            PrintSupportedStandardSampleRates(NULL, &outputParameters);
        }

        if (inputParameters.channelCount > 0 && outputParameters.channelCount > 0)
        {
            printf("Supported standard sample rates\n for full-duplex 16 bit %d channel input, %d channel output = \n",
                   inputParameters.channelCount, outputParameters.channelCount);
            PrintSupportedStandardSampleRates(&inputParameters, &outputParameters);
        }
    }
}

#endif