using System;
using System.Linq;
using com.csutil;
using UnityEngine;
using UnityEngine.EventSystems;
using Mapbox.Unity.Map;

namespace App.Controller
{
    [RequireComponent(typeof(Camera))]

    public class RtsCameraController : MonoBehaviour {

        public float ScreenEdgeBorderThickness = 10.0f; // distance from screen edge. Used for mouse movement

        [Header("Camera Mode")]
        [Space]
        public bool RTSMode = true;
        public bool FlyCameraMode = false;

        [Header("Movement Speeds")]
        [Space]
        public float minPanSpeed = 50.0f;
        public float maxPanSpeed = 200.0f;
        public float secToMaxSpeed = 4.0f; //seconds taken to reach max speed;
        public float zoomSpeed = 0.5f;

        [Header("Movement Limits")]
        [Space]
        public bool enableMovementLimits = false;
        public Vector2 heightLimit;
        public Vector2 lenghtLimit;
        public Vector2 widthLimit;
        private Vector2 zoomLimit;

        public float panSpeed = 50;
        private Vector3 initialPos;
        private Vector3 panMovement;
        private Vector3 pos;
        private Quaternion rot;
        private bool rotationActive = false;
        private Vector3 lastMousePosition;
        private Quaternion initialRot;
        private float panIncrease = 0.0f;

        [Header("Rotation")]
        [Space]
        public bool rotationEnabled;
    
        public float rotateSpeed = 1;

        private AbstractMap map;
    
        Quaternion _originalRotation;

        public float movementTime = 10;
        public bool lerpMovement = false;
    
        private Vector3 _newPosition;
        private Quaternion _newRotation;
    
        private Vector3 _dragOrigin;
        private bool _isDragging;

        private Camera camera;
    
        private void Start ()
        {
            var t = transform;
        
            initialPos = t.position;
            initialRot = t.rotation;
            zoomLimit.x = 15;
            zoomLimit.y = 65;

            _newPosition = t.position;
            _newRotation = t.rotation;
        
            // TODO: don't link to the map anymore at all, probably?
            // map = FindObjectOfType<AbstractMap>();
            camera = GetComponent<Camera>();
        
            iTween.Init(gameObject);
        
            UpdateMapZoom();
        }
    
        void Update () {
            //check that ony one mode is choosen
            // if (RTSMode == true) FlyCameraMode = false;
            // if (FlyCameraMode == true) RTSMode = false;

            // panMovement = Vector3.zero;
            //
            // if (Input.GetKey(KeyCode.W))// || Input.mousePosition.y >= Screen.height - ScreenEdgeBorderThickness)
            // {
            //     panMovement += Vector3.forward * panSpeed * Time.deltaTime;
            // }
            // if (Input.GetKey(KeyCode.S))// || Input.mousePosition.y <= ScreenEdgeBorderThickness)
            // {
            //     panMovement -= Vector3.forward * panSpeed * Time.deltaTime;
            // }
            // if (Input.GetKey(KeyCode.A))// || Input.mousePosition.x <= ScreenEdgeBorderThickness)
            // {
            //     panMovement += Vector3.left * panSpeed * Time.deltaTime;
            // }
            // if (Input.GetKey(KeyCode.D))// || Input.mousePosition.x >= Screen.width - ScreenEdgeBorderThickness)
            // {
            //     panMovement += Vector3.right * panSpeed * Time.deltaTime;
            //     //pos.x += panSpeed * Time.deltaTime;
            // }
            // if (Input.GetKey(KeyCode.Q))
            // {
            //     panMovement += Vector3.up * panSpeed * Time.deltaTime;
            // }
            // if (Input.GetKey(KeyCode.E))
            // {
            //     panMovement += Vector3.down * panSpeed * Time.deltaTime;
            // }

            // if(RTSMode) transform.Translate(panMovement, Space.World);
            // else if(FlyCameraMode) transform.Translate(panMovement, Space.Self);

            //increase pan speed
            // if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.S) 
            //     || Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.D)
            //     || Input.GetKey(KeyCode.E) || Input.GetKey(KeyCode.Q)
            //     || Input.mousePosition.y >= Screen.height - ScreenEdgeBorderThickness
            //     || Input.mousePosition.y <= ScreenEdgeBorderThickness
            //     || Input.mousePosition.x <= ScreenEdgeBorderThickness
            //     || Input.mousePosition.x >= Screen.width - ScreenEdgeBorderThickness)
            // {
            //     panIncrease += Time.deltaTime / secToMaxSpeed;
            //     panSpeed = Mathf.Lerp(minPanSpeed, maxPanSpeed, panIncrease);
            // }
            // else
            // {
            //     panIncrease = 0;
            //     panSpeed = minPanSpeed;
            // }
        
            // transform.Translate(Vector3.forward * (Input.mouseScrollDelta.y * zoomSpeed));
            // Camera.main.fieldOfView -= Input.mouseScrollDelta.y * zoomSpeed;
            // Camera.main.fieldOfView = Mathf.Clamp(Camera.main.fieldOfView,zoomLimit.x,zoomLimit.y);
            // if (Math.Abs(Input.mouseScrollDelta.y) > 0)
            // {
            // map.UpdateMap(Mathf.Clamp(map.Zoom + Input.mouseScrollDelta.y, 7, 18));
            // }

            // if (rotationEnabled)
            // {
            //     // Mouse Rotation
            //     if (Input.GetMouseButton(1))
            //     {
            //         rotationActive = true;
            //         Vector3 mouseDelta;
            //         if (lastMousePosition.x >= 0 &&
            //             lastMousePosition.y >= 0 &&
            //             lastMousePosition.x <= Screen.width &&
            //             lastMousePosition.y <= Screen.height)
            //             mouseDelta = Input.mousePosition - lastMousePosition;
            //         else
            //         {
            //             mouseDelta = Vector3.zero;
            //         }
            //         var rotation = Vector3.up * Time.deltaTime * rotateSpeed * mouseDelta.x;
            //         rotation += Vector3.left * Time.deltaTime * rotateSpeed * mouseDelta.y;
            //
            //         transform.Rotate(rotation, Space.World);
            //
            //         // Make sure z rotation stays locked
            //         rotation = transform.rotation.eulerAngles;
            //         rotation.z = 0;
            //         transform.rotation = Quaternion.Euler(rotation);
            //         // _newRotation = Quaternion.Euler(rotation);
            //     }
            //
            //     if (Input.GetMouseButtonUp(1))
            //     {
            //         rotationActive = false;
            //         // if (RTSMode) transform.rotation = Quaternion.Slerp(transform.rotation, initialRot, 0.5f * Time.time);
            //     }
            //
            //     lastMousePosition = Input.mousePosition;
            // }
        
            

            HandleKeyboardPan();
            HandleKeyboardRotate();
            HandleDragging();
            HandleDragRotate();
            HandleZooming();
            HandleFlyPath();
        
            // Finally update the position
            var t = transform;
            if (lerpMovement)
            {
                var position = t.position;
                var heightSpeedModifier = position.y / 300;
            
                t.position = Vector3.Lerp(position, _newPosition, Time.deltaTime * movementTime * heightSpeedModifier);
                t.rotation = Quaternion.Lerp(t.rotation, _newRotation, Time.deltaTime * movementTime);
            }
            else
            {
                if (_isFlying) return;
                
                if (enableMovementLimits == true)
                {
                    //movement limits
                    _newPosition.y = Mathf.Clamp(_newPosition.y, heightLimit.x, heightLimit.y);
                    _newPosition.z = Mathf.Clamp(_newPosition.z, lenghtLimit.x, lenghtLimit.y);
                    _newPosition.x = Mathf.Clamp(_newPosition.x, widthLimit.x, widthLimit.y);
                }
            
                t.position = _newPosition;
                t.rotation = _newRotation;
            }
        }

        private void HandleKeyboardPan()
        {
            var zoomModifier = 2; //Mathf.Pow(2, 16) / Mathf.Pow(2, map.AbsoluteZoom);
            var speed = panSpeed * zoomModifier;
        
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow))
            {
                _newPosition += Vector3.forward * speed;
            }
        
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow))
            {
                _newPosition += Vector3.back * speed;
            }
        
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow))
            {
                _newPosition += Vector3.left * speed;
            }
        
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow))
            {
                _newPosition += Vector3.right * speed;
            }
        }

        private void HandleKeyboardRotate()
        {
            if (!Input.GetKey(KeyCode.Q) && !Input.GetKey(KeyCode.E)) return;

            var direction = Input.GetKey(KeyCode.Q) ? -rotateSpeed : rotateSpeed;
        
            var rotation = transform.rotation;
            var newY = rotation * Quaternion.AngleAxis(direction, Vector3.up);
            _newRotation = Quaternion.Euler(rotation.eulerAngles.x, newY.eulerAngles.y, 0);
        }

        private void HandleDragging()
        {
            if (Input.GetMouseButton(0))
            {
                var plane = new Plane(Vector3.up, Vector3.zero);
                var ray = camera.ScreenPointToRay(Input.mousePosition);

                if (!plane.Raycast(ray, out var entry)) return;
            
                // Start the dragging
                if (Input.GetMouseButtonDown(0) && !EventSystem.current.IsPointerOverGameObject())
                {
                    _dragOrigin = ray.GetPoint(entry);
                    _isDragging = true;
                }

                if (_isDragging)
                {
                    _newPosition = transform.position + _dragOrigin - ray.GetPoint(entry);
                }
            }
            else
            {
                _isDragging = false;
            }
        }

        private void HandleDragRotate()
        {
            // No orbit while dragging
            if (_isDragging) return;

            // Right mouse button
            if (!Input.GetMouseButton(1)) return;

            if (Input.GetMouseButtonDown(1))
            {
                lastMousePosition = Input.mousePosition;
            }
        
            var _orbitSensitivity = 0.3f;
            var mouseDelta = Input.mousePosition - lastMousePosition;

            var yQuaternion = Quaternion.AngleAxis(mouseDelta.x * _orbitSensitivity, Vector3.up);
            var xQuaternion = Quaternion.AngleAxis(mouseDelta.y * _orbitSensitivity, -Vector3.right);
        
            var newRotation = transform.rotation * xQuaternion * yQuaternion;
            var newAngleX = newRotation.eulerAngles.x;

            // Lock the x between 5 and 85
            if (mouseDelta.y > 0 && (newAngleX > 90 || newAngleX < 5)) newAngleX = 5;
            if (mouseDelta.y < 0 && newAngleX > 85) newAngleX = 85;
        
            // Lock z to 0
            _newRotation = Quaternion.Euler(newAngleX, newRotation.eulerAngles.y, 0);

            lastMousePosition = Input.mousePosition;
        }

        private void HandleZooming()
        {
            // No zoom when dragging
            if (_isDragging) return;
        
            // No zoom when over a game object
            if (EventSystem.current.IsPointerOverGameObject()) return;

            // No zoom when there is no focus
            if (!Application.isFocused) return;

            var x = Input.GetAxis("Horizontal");
            var z = Input.GetAxis("Vertical");
            var y = Input.GetAxis("Mouse ScrollWheel") * zoomSpeed;
        
            if (!(Mathf.Approximately(x, 0) && Mathf.Approximately(y, 0) && Mathf.Approximately(z, 0)))
            {
                void nearDelta(float yi)
                {
                    // Calculate the zoom delta
                    var delta = transform.forward * yi + (_originalRotation * new Vector3(x * panSpeed, 0, z * panSpeed));

                    if (enableMovementLimits == true)
                    {
                        if (Math.Abs((_newPosition + delta).y - heightLimit.x) < 0.01 || Math.Abs((_newPosition + delta).y - heightLimit.y) < 0.01) return;
                        if ((_newPosition + delta).y > heightLimit.y) return;
                        
                        // Recurse to get lower to the bounds
                        if ((_newPosition + delta).y < heightLimit.x)
                        { 
                            nearDelta(yi / 2);
                            return;
                        }
                    }

                    // Update the position
                    _newPosition += delta;
    
                    // Now see if the zoom level of the map also needs to be updated
                    // TODO: linking should be removed?
                    UpdateMapZoom();
                }
                
                nearDelta(y);
            }
        }

        private void UpdateMapZoom()
        {
            var newY = transform.localPosition.y;
            var tileSizeBasicForThisMap = 6378137 * Mathf.Cos(Mathf.PI / 180 * 52.004095f);

            // Tile size is based on the zoom level, so from expected size (based on the height),
            //  ... we can also calculate the zoom level
            // 2^zoomlevel = tileSizeBasicForThisMap / 256
            // zoomlevel = Mathf.Log(tileSizeBasicForThisMap / 256, 2)
            var zoomLevelCalc = Mathf.Log(tileSizeBasicForThisMap / (newY * 4), 2);
            var newZoom = (int) Mathf.Ceil(Mathf.Clamp(zoomLevelCalc + 4, 15f, 21f));
                
            // Debug.Log($"Calculated zoom level: {zoomLevelCalc}, final: {newZoom}, initial: {map.InitialZoom}, absolute: {map.AbsoluteZoom}, y: {newY}");

            // Only update the map if it will end up changing the zoom level
            if (map != null && newZoom != map.AbsoluteZoom)
            {
                map.UpdateMap(newZoom);
            }
        }

        private bool _isFlying = false;
        private Vector3[] _flyPath = new Vector3[] { }; 

        private void HandleFlyPath()
        {
            if (Input.GetKeyDown(KeyCode.G) && !_isFlying)
            {
                _isFlying = true;

                var path = _flyPath;
                if (path.Length == 0)
                {
                    path = GameObject
                        .FindGameObjectsWithTag("WayPoint")
                        .OrderBy(o => o.name)
                        .Map(o => o.transform.position)
                        .ToArray();
                }
            
                var bounds = new Bounds();
                foreach (var vector3 in path)
                {
                    bounds.Encapsulate(vector3);
                }

                iTween.MoveTo(gameObject, iTween.Hash(
                    "path", path, 
                    "movetopath", false,
                    "easeType", "easeInOutSine",
                    "speed", 200,
                    "looktarget", bounds.center.SetY(bounds.center.y - 100),
                    // "orienttopath", true,
                    // "lookahead", 0.8,
                    "oncomplete", "FlyComplete",
                    "oncompletetarget", gameObject
                ));
            }

            if (Input.GetKeyDown(KeyCode.H) && !_isFlying)
            {
                _flyPath = _flyPath.Append(transform.position).ToArray();
            }
        }

        private void FlyComplete()
        {
            Debug.Log("Flying is complete!");
            _isFlying = false;
            _newPosition = transform.position;
        }
    }
}
