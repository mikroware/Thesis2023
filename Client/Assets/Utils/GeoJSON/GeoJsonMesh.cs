using UnityEngine;

namespace Utils.GeoJSON
{
    public class GeoJsonMesh
    {
        private Mesh _mesh;
        
        public GeoJsonMesh(Vector2[] vertices2D)
        {
            this._mesh = GeoJson.CreateMesh(vertices2D);
        }

        public GeoJsonMesh AddUvs()
        {
            GeoJson.AddUvsToMesh(_mesh);
            
            return this;
        }

        public GeoJsonMesh ConvertToExtruded(bool invertFaces = true)
        {
            _mesh = GeoJson.GetExtrudedNormalMesh(_mesh, invertFaces);
                
            return this;
        }

        public Mesh GetMesh()
        {
            return _mesh;
        }

        public GeoJsonMesh AddBasicRenderer(GameObject gameObject)
        {
            gameObject.AddComponent<MeshRenderer>()
                .sharedMaterial = new Material(Shader.Find("Standard"));
            gameObject.AddComponent<MeshFilter>()
                .mesh = _mesh;
            gameObject.AddComponent<MeshCollider>()
                .sharedMesh = _mesh;

            return this;
        }
    }
}