using System;

namespace App.Events
{
    [Serializable]
    public struct InternalDto
    {
        public bool? connected;
        public bool? connecting;

        public override string ToString()
        {
            return $"Connected: {connected.ToString()} | Connecting: {connecting.ToString()}";
        }
    }
    
    public abstract class InternalEvent : Event<InternalDto, InternalEvent>
    {
        
    }
}
