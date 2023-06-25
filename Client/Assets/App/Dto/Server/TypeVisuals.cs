using System;
using System.Collections.Generic;

[Serializable]
public struct VisualTypes
{
    
}

[Serializable]
public struct VisualValue
{
    
}

[Serializable]
public struct Visuals
{
    public VisualTypes types;
    public Dictionary<string, List<List<string>>> values;
}

namespace App.Dto.Server
{
    [Serializable]
    public struct TypeVisuals
    {
        public string type;
        
        public List<Visuals> visuals;
    }
}