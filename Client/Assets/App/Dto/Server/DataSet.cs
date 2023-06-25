using System;

namespace App.Dto.Server
{
    [Serializable]
    public struct DataSet
    {
        public string cacheFile;
        public bool enabled;
    }
}