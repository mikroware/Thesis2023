using System;
using Mapbox.Utils;
using UnityEngine;

namespace App.Dto.Client
{
    [Serializable]
    public class MetricsFile
    {
        public string type = "metricsFile";
        public string file;
        public float fetch;
        public float deserialize;
        public float all;
    }
}