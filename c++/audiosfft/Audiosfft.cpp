
#include "Audiosfft.h"
#include "audio.h"
#include "utils.h"

#include <iostream>
#include <string>

// Pyton https://www.tensorflow.org/tutorials/audio/simple_audio?hl=es-419

int main(int argc, char *argv[])
{
    cv::CommandLineParser parser(argc, argv,
                                 "{@input   i|../data/example.json|input json file}"
                                 "{@output   o|../data/output.json|output json file}");
    parser.printMessage();
    std::string inputFilePath = parser.get<cv::String>("@input");
    std::string outputFilePath = parser.get<cv::String>("@output");
    std::string fileContent = readTextFile(inputFilePath);
    json inputData = json::parse(fileContent);

    UserAudioData audioData;
    unsigned int numSamples = floor((float)inputData["SECONDS"] * (unsigned int)inputData["SAMPLE_RATE"]);
    int numBytes = numSamples * sizeof(SAMPLE);
    std::cout << "Buffer has " << numBytes << " bytes with " << numSamples << " samples" << std::endl;
    audioData.startingPoint = 0;
    audioData.maxSize = numSamples;
    audioData.line = (SAMPLE *)malloc(numBytes);
    if (audioData.line == NULL)
    {
        std::cout << "Error reservando " << numBytes << " bytes" << std::endl;
        return -1;
    }
    else
    {
        std::cout << "Reservados " << numBytes << " bytes" << std::endl;
    }
    for (unsigned int i = 0; i < numSamples; i++)
    {
        audioData.line[i] = 0;
    }

    cv::Mat gray = createGrayScaleImage(sizeof(IMAGE_MAT_TYPE) * 256, inputData["DISPLAY_WIDTH"], 0);

    audioData.gapReady = false;
    audioData.countGap = 0;
    audioData.maxGap = floor((float)inputData["GAP_DFT_SECONS"] * (unsigned int)inputData["SAMPLE_RATE"]);
    std::cout << "maxGap: " << audioData.maxGap << std::endl;

    // Create images for dft
    unsigned int WINDOW_DFT = floor((float)inputData["WINDOW_DFT_SECONS"] * (unsigned int)inputData["SAMPLE_RATE"]);
    // Force to be the closest even number...
    WINDOW_DFT = round(WINDOW_DFT / 2) * 2;
    std::cout << "WINDOW_DFT: " << WINDOW_DFT << std::endl;
    cv::Mat baseDft = createBaseDft(WINDOW_DFT);
    cv::Mat planes1 = cv::Mat::zeros(baseDft.size(), CV_32F);
    cv::Mat planes0 = cv::Mat_<float>(baseDft);
    unsigned int dftWidth = (numSamples - WINDOW_DFT) / (float)audioData.maxGap;
    std::cout << "dftWidth: " << dftWidth << std::endl;
    cv::Mat *spectrogram = new cv::Mat(inputData["DFT_HEIGHT"], dftWidth, CV_32F, cv::Scalar::all(0));
    cv::Mat *cm_spectrogram = new cv::Mat(inputData["DFT_HEIGHT"], dftWidth, CV_8UC3, cv::Scalar(0, 0, 0));

    if (!initializeAudio())
    {
        return -1;
    }

    PaStreamParameters inputParameters;
    inputParameters.device = inputData["device"];
    if (inputParameters.device < 0)
    {
        inputParameters.device = Pa_GetDefaultInputDevice();
    }
    std::cout << "inputParameters.device = " << inputParameters.device << std::endl;

    PaStream *stream = NULL;
    if (inputData["program"] == 1)
    {
        displayAudioDevices();
    }
    else if (inputData["program"] == 2)
    {
        stream = sampleAudio(&audioData, stream, &inputParameters, &inputData);

        while (true)
        {
            printAudioOnImage(&gray, &audioData, &inputData);
            computeDft(&baseDft, &audioData, &inputData, spectrogram, cm_spectrogram, &planes0, &planes1);
            showImage(&gray);
            showSTFT(cm_spectrogram);
            int value = cv::waitKey(1);
            if (value == 113)
            {
                // q
                break;
            }
            else if (value == 115)
            {
                // s
                saveWav("/home/ejfdelgado/desarrollo/ejflab/c++/audiosfft/data/audio/salida.wav", &audioData, &inputData);
            }
        }

        gray.release();
    }

    if (terminateAudio(stream))
    {
        std::cout << "terminateAudio Ok!" << std::endl;
    }

    std::string s = inputData.dump();
    // writeTextFile(s, outputFilePath);
    std::cout << s << std::endl;

    free(audioData.line);
    return 0;
}
