using System;

namespace App.Dto.Server
{
    [Serializable]
    public struct OnConnect
    {
        public string type;
        
        public string isLoaded;
        public DataSet[] dataset;

        public override string ToString()
        {
            return base.ToString() + type;
        }
    }
}