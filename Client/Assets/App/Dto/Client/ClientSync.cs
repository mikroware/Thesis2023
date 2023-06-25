using System;
using Mapbox.Utils;
using UnityEngine;

namespace App.Dto.Client
{
    [Serializable]
    public class ClientSync
    {
        public string type = "clientSync";
        public Vector2d position;
        public Quaternion rotation;
        public float height;
        public string activeItem;
    }
}