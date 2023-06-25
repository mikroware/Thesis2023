using Mapbox.Unity;
using UnityEngine;

namespace Utils.GeoJSON
{
    public class GeoJson
    {
        public static Mesh CreateMesh(Vector2[] vertices2D)
        {
            // Use the triangulator to get indices for creating triangles
            Triangulator tr = new Triangulator(vertices2D);
            int[] indices = tr.Triangulate();
 
            // Create the Vector3 vertices
            Vector3[] vertices = new Vector3[vertices2D.Length];
            for (int i=0; i<vertices.Length; i++) {
                // This switches from the xy pane to the xz pane
                vertices[i] = new Vector3(vertices2D[i].x, 0, vertices2D[i].y);
            }
 
            // Create the mesh
            Mesh msh = new Mesh();
            msh.vertices = vertices;
            msh.triangles = indices;
            msh.RecalculateNormals();
            msh.RecalculateBounds();

            return msh;
        }

        public static void AddUvsToMesh(Mesh mesh)
        {
            var vertices = mesh.vertices;
            var uvs = new Vector2[vertices.Length];

            for (var i = 0; i < uvs.Length; i++)
            {
                uvs[i] = new Vector2(vertices[i].x, vertices[i].z);
            }
            mesh.uv = uvs;
        }

        public static Mesh GetExtrudedNormalMesh(Mesh mesh, bool invertFaces = true)
        {
            // The extrusion matrix, keep on at the original place, translate the other over Y axis
            Matrix4x4[] extrudeMatrix = {
                new Matrix4x4(
                    new Vector4(1,0,0,0),
                    new Vector4(0,1,0,0),
                    new Vector4(0,0,1,0),
                    new Vector4(0,0,0,1)),

                new Matrix4x4(
                    new Vector4(1,0,0,0),
                    new Vector4(0,1,0,0),
                    new Vector4(0,0,1,0),
                    new Vector4(0,1,0,1))
            };
            
            var extrudedMesh = new Mesh();
            
            MeshExtrusion.ExtrudeMesh(mesh, extrudedMesh, extrudeMatrix, invertFaces);

            return extrudedMesh;
        }
    }
}
