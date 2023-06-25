using System;
using com.csutil;
using UnityEngine;

namespace App.Events
{
    public abstract class Event<TDataType, TSelfReferenceType>
    {
        // TODO: Might need this, abstract + static does not work
        // https://stackoverflow.com/questions/15346631/how-to-implement-virtual-static-properties
        // Might need to make it a singleton pattern

        private static string GetEventName()
        {
            return typeof(TSelfReferenceType).Name;
        }

        public static void Publish(TDataType data)
        {
            // Debug.Log("Publishing event: " + GetEventName());
            (EventBus.instance as EventBus)?.Publish(GetEventName(), data);
        }

        public static void Subscribe(object subscriber, Action<TDataType> func)
        {
            // If the subscriber is a gameObject, use its internal subscriber
            // This will take care of the lifecycle methods 
            if (subscriber is GameObject gameObject)
            {
                gameObject.Subscribe<TDataType>(GetEventName(), func);
            }
            else
            {
                (EventBus.instance as EventBus)?.Subscribe<TDataType>(subscriber, GetEventName(), func);
            }
        }
        
        public static void Unsubscribe(object subscriber)
        {
            (EventBus.instance as EventBus)?.Unsubscribe(subscriber, GetEventName());
        }
    }
}