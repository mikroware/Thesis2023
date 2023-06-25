using UnityEngine;

namespace App
{
    public class ApplicationConfig : MonoBehaviour
    {
#if UNITY_STANDALONE && !UNITY_EDITOR
    public string serverUrl = "thesis.mikroprojects.nl:2345";
#else
        public string serverUrl = "localhost:2345";
#endif
        public string latestServerConnectionError = "";
    
        private void Awake()
        {
            // Need to keep this between scenes, but don't let it be re-created
            if (FindObjectsOfType<ApplicationConfig>().Length != 1)
            {
                Destroy(gameObject);
            }
            else
            {
                DontDestroyOnLoad(gameObject);
            }
        }
    }
}
