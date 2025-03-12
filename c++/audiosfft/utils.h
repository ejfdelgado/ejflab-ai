#ifndef __utils_h__
#define __utils_h__

#include <cstdio>
#include <iostream>
// #include <map>
// #include <iterator>
#include <fstream>
#include <string>
#include <regex>
#include <sstream>
#include <unordered_map>
// https://github.com/nlohmann/json/tree/v3.11.2#cmake
#include <nlohmann/json.hpp>
using json = nlohmann::json;
using namespace std;

// file - std:string
std::string readTextFile(std::string path);
void writeTextFile(std::string data, std::string path);

// json - std::map
/*
  json data = json::parse("./archivo.json");
  std::map<std::string, double> mapa = json2Map<double>(&data);
  std::cout << mapa["texto"] << std::endl;
*/
template <typename T>
std::map<std::string, T> json2Map(json *v2);
/*
  std::map<std::string, std::string> example;
  example["algo"] = "valor";
  json data = map2Json<string>(&example);
*/
template <typename T>
std::map<std::string, T> map2Json(std::map<std::string, T> *map);

std::string readTextFile(std::string path)
{
  ifstream fileStream(path.c_str());
  std::stringstream buffer;
  buffer << fileStream.rdbuf();
  return buffer.str();
}

void writeTextFile(std::string data, std::string path)
{
  std::ofstream out(path.c_str());
  out << data;
  out.close();
}

template <typename T>
std::map<std::string, T> json2Map(json *v2)
{
  std::map<std::string, T> map;

  for (auto &el : v2->items())
  {
    map[el.key()] = el.value();
  }

  return map;
}

template <typename T>
std::map<std::string, T> map2Json(std::map<std::string, T> *map)
{
  json output;

  typename std::map<std::string, T>::iterator it = map->begin();

  while (it != map->end())
  {
    std::string word = it->first;
    output[word] = it->second;
    it++;
  }
  return output;
}

#endif