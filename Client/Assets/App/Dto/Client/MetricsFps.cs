using System;
using Mapbox.Utils;
using UnityEngine;

namespace App.Dto.Client
{
    [Serializable]
    public class MetricsFps
    {
        public string type = "metricsFps";
        public float fps;
    }
}