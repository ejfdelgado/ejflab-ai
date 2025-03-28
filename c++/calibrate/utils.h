#ifndef __utils_h__
#define __utils_h__

#include <cstdio>
#include <iostream>
#include <fstream>
#include <string>
#include <regex>
#include <sstream>
#include <unordered_map>
//https://github.com/nlohmann/json/tree/v3.11.2#cmake
#include <nlohmann/json.hpp>
using json = nlohmann::json;

template <typename T>
std::vector<T> parseStringVector(std::string texto)
{
  const std::string espacios = std::regex_replace(texto, std::regex(","), " ");
  std::stringstream iss(espacios);

  T number;
  std::vector<T> myNumbers;
  while (iss >> number)
    myNumbers.push_back(number);
  return myNumbers;
}

std::string cleanText(std::string texto)
{
  // Solo dejamos los caracteres que están en la lista a continuación
  texto = std::regex_replace(texto, std::regex("[^A-Za-zÑÁÉÍÓÚÜñáéíóúü\\s]"), "");
  // Quitamos todos los espacios al final
  texto = std::regex_replace(texto, std::regex("\\s+$"), "");
  // Quitamos los espacios al inicio
  texto = std::regex_replace(texto, std::regex("^\\s+"), "");
  return texto;
}

std::string cleanNumber(std::string texto)
{
  // Salvamos algunos números que se asumen como letras
  texto = std::regex_replace(texto, std::regex("[oO]"), "0");
  // Elimina todo lo que no sea número
  texto = std::regex_replace(texto, std::regex("[^0-9]"), "");
  // Quitamos todos los espacios al final
  texto = std::regex_replace(texto, std::regex("[\\s]"), "");
  // Quitamos los espacios al inicio
  texto = std::regex_replace(texto, std::regex("^\\s+"), "");
  return texto;
}

std::vector<cv::Point2f> parseStringPoint2f(std::string texto)
{
  std::vector<int> numeros = parseStringVector<int>(texto);
  uint halfSize = numeros.size() / 2;

  std::vector<cv::Point2f> resultado;
  for (uint i = 0; i < halfSize; i++)
  {
    float x = numeros[2 * i];
    float y = numeros[2 * i + 1];
    resultado.push_back(cv::Point2f(x, y));
  }
  return resultado;
}

std::vector<std::string> readLabelsFile(const char *path)
{
  std::vector<std::string> myvector;
  std::fstream newfile;
  newfile.open(path, std::ios::in);
  if (newfile.is_open())
  {
    std::string tp;
    while (getline(newfile, tp))
    {
      myvector.push_back(tp);
    }
    newfile.close();
  }

  return myvector;
}

cv::ImreadModes string2ImreadModesEnum(std::string str)
{
  static std::unordered_map<std::string, cv::ImreadModes> const table = {
      {"IMREAD_GRAYSCALE", cv::ImreadModes::IMREAD_GRAYSCALE},
      {"IMREAD_COLOR", cv::ImreadModes::IMREAD_COLOR}};
  auto it = table.find(str);
  if (it != table.end())
  {
    return it->second;
  }
  else
  {
    return cv::ImreadModes::IMREAD_COLOR;
  }
}

cv::Mat closing(cv::Mat &dest, int erosion_size) {
    // equalizar
    cv::Mat grayScale;
    cv::cvtColor(dest, grayScale, cv::COLOR_BGR2GRAY);
    // cv::Mat equalized;
    // cv::equalizeHist( grayScale, equalized );

    int erosion_type;
    //int erosion_size = 1;
    // erosion_type = cv::MORPH_RECT;
    erosion_type = cv::MORPH_CROSS;
    // erosion_type = cv::MORPH_ELLIPSE;

    cv::Mat erosionElement = cv::getStructuringElement(erosion_type,
                                                       cv::Size(2 * erosion_size + 1, 2 * erosion_size + 1),
                                                       cv::Point(erosion_size, erosion_size));
    cv::Mat erosion_dst;
    cv::erode(grayScale, erosion_dst, erosionElement);
    cv::Mat dilate_dst;
    cv::dilate(erosion_dst, dilate_dst, erosionElement);

    return dilate_dst;
}

cv::Mat squareImage(cv::Mat &image, uint sizeScaled, uint* offsetXOut, uint* offsetYOut) {
  cv::Mat scaled;
  uint originalWidth = image.cols;
  uint originalHeight = image.rows;
  uint scaledWidth = sizeScaled;
  uint scaledHeight = sizeScaled;
  uint offsetX = 0;
  uint offsetY = 0;
  if (originalWidth > originalHeight)
  {
    scaledHeight = sizeScaled * image.rows / image.cols;
    offsetY = (sizeScaled - scaledHeight) * 0.5;
  }
  else
  {
    scaledWidth = sizeScaled * image.cols / image.rows;
    offsetX = (sizeScaled - scaledWidth) * 0.5;
  }
  if (offsetYOut != NULL) {
    *offsetYOut = offsetY;
  }
  if (offsetXOut != NULL) {
    *offsetXOut = offsetX;
  }
  cv::Mat squared(sizeScaled, sizeScaled, CV_8UC3, cv::Scalar(0, 0, 0));
  cv::resize(image, scaled, cv::Size(scaledWidth, scaledHeight), 0, 0, cv::INTER_AREA);

  for (uint i = 0; i < scaledHeight; i++)
  {
    cv::Vec3b *ptr = scaled.ptr<cv::Vec3b>(i);
    cv::Vec3b *ptrDest = squared.ptr<cv::Vec3b>(i + offsetY);
    for (uint j = 0; j < scaledWidth; j++)
    {
      ptrDest[j + offsetX] = cv::Vec3b(ptr[j][0], ptr[j][1], ptr[j][2]);
    }
  }
  return squared;
}

// Mat cropped_image = img(Range(80,280), Range(150,330));
cv::Mat cutImage(cv::Mat &src, std::vector<cv::Point2f> source, uint destWidth, uint destHeight)
{
  cv::Point2f srcTri[4];
  srcTri[0] = source[0];
  srcTri[1] = source[1];
  srcTri[2] = source[2];
  srcTri[3] = source[3];

  cv::Point2f dstTri[4];
  dstTri[0] = cv::Point2f(0.f, 0.f);
  dstTri[1] = cv::Point2f(destWidth, 0.f);
  dstTri[2] = cv::Point2f(0, destHeight);
  dstTri[3] = cv::Point2f(destWidth, destHeight);
  cv::Mat warp_dst = cv::Mat::zeros(destHeight, destWidth, src.type());

  cv::Mat warp_mat = cv::getPerspectiveTransform(srcTri, dstTri);
  cv::warpPerspective(src, warp_dst, warp_mat, warp_dst.size());

  return warp_dst;
}

std::string jsonifyImageData(cv::Mat image)
{
  std::stringstream ss;
  ss << "{";
  ss << "\"width\":" << image.cols << ", ";
  ss << "\"height\":" << image.rows << ", ";
  ss << "\"chanells\":" << image.channels();
  ss << "}";
  return ss.str();
}

std::string getRegexGroup(std::string pattern, std::string sp, int group)
{
  std::regex re(pattern.c_str());
  std::smatch match;
  if (std::regex_search(sp, match, re) == true)
  {
    // std::cout << "Match size = " << match.size() << std::endl;
    //  match.position(1)
    return match.str(group);
  }
  else
  {
    return "";
  }
}

#endif