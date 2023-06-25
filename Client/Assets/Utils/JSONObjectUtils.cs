using UnityEngine;

namespace Utils
{
    public class JSONObjectUtils
    {
        public static Quaternion ToQuaternion(JSONObject obj)
        {
            return new Quaternion(obj["x"].f, obj["y"].f, obj["z"].f, obj["w"].f);
        }
    }
}