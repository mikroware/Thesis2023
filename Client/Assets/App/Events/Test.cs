using System;

namespace App.Events
{
    public class Test : Event<object, Test>
    {
        // public new static string EventName = "TEST";

        // protected override string EventName => "TEST";
    }
}