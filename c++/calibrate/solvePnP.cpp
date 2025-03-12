/**
 * This program takes a set of corresponding 2D and 3D points and finds the transformation matrix
 * that best brings the 3D points to their corresponding 2D points.
 */
#include "solvePnP.h"
#include "utils.h"

#include <iostream>
#include <string>

int main(int argc, char *argv[])
{
    std::string argument = argv[1];
    json data = json::parse(argument);
    try
    {
        std::vector<Data2D> size = json2Data2DVector(&(data["size"]));
        std::vector<Data2D> focal = json2Data2DVector(&(data["focal"]));
        std::vector<Data2D> ref2D = json2Data2DVector(&(data["v2"]));
        std::vector<Data3D> ref3D = json2Data3DVector(&(data["v3"]));
        std::vector<Data3D> points3d;
        if (data.contains("points3d"))
        {
            points3d = json2Data3DVector(&(data["points3d"]));
        }
        // Read from file if points3dPath
        if (data.contains("points3dPath"))
        {
            std::string path = data["points3dPath"];
            std::ifstream ifs(path);
            json jf = json::parse(ifs);
            points3d = json2Data3DVector(&jf);
        }

        computeCamera(&data, ref2D, ref3D, size, focal, points3d);
    }
    catch (cv::Exception &e)
    {
        const char *err_msg = e.what();
        data["error"] = err_msg;
    }
    catch (const std::exception &e)
    {
        data["error"] = e.what();
    }
    std::string s = data.dump();
    std::cout << s << std::endl;
    return 0;
}
