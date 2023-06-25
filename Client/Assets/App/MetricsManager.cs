using UnityEngine;

namespace App
{
    public class MetricsManager : MonoBehaviour
    {
        private DataManager _dataManager;
        
        private void Start()
        {
            _dataManager = FindObjectOfType<DataManager>();
            
            InvokeRepeating(nameof(SyncFps), 3.0f, 2f);        
        }

        private void SyncFps()
        {
            var fps = 1 / Time.unscaledDeltaTime;

            _dataManager.SocketSendToServer(new Dto.Client.MetricsFps
            {
                fps = fps,
            });
        }

        public void SendLoadFile(string file, float fetch, float deserialize, float all)
        {
            Debug.Log($"File {file}: {fetch} {deserialize} {all}");
            _dataManager.SocketSendToServer(new Dto.Client.MetricsFile
            {
                file = file,
                fetch = fetch,
                deserialize = deserialize,
                all = all,
            });
        }
        
        public void SendLoadVisuals(float all)
        {
            Debug.Log($"Visuals: {all}");
            _dataManager.SocketSendToServer(new Dto.Client.MetricsVisuals
            {
                all = all,
            });
        }
    }
}
