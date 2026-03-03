using UnityEditor;
using UnityEngine;
using System.IO;
using System.Text;
using System.Collections.Generic;

namespace BlueWirks
{
    /// <summary>
    /// Unity Editor tool that exports the current scene hierarchy
    /// as a JSON manifest for ingestion into BlueWirks Intelligence Cloud.
    /// </summary>
    public class BlueWirksSceneExporter : EditorWindow
    {
        private string _outputPath = "Assets/Export";

        [MenuItem("BlueWirks/Export Scene Manifest")]
        public static void ShowWindow()
        {
            GetWindow<BlueWirksSceneExporter>("BlueWirks Scene Exporter");
        }

        private void OnGUI()
        {
            GUILayout.Label("BlueWirks Scene Exporter", EditorStyles.boldLabel);
            GUILayout.Space(10);

            _outputPath = EditorGUILayout.TextField("Output Path", _outputPath);

            GUILayout.Space(10);

            if (GUILayout.Button("Export Current Scene"))
            {
                ExportScene();
            }
        }

        private void ExportScene()
        {
            var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            var rootObjects = scene.GetRootGameObjects();

            var manifest = new SceneManifest
            {
                sceneName = scene.name,
                unityVersion = Application.unityVersion,
                gameObjects = new List<GameObjectData>()
            };

            foreach (var go in rootObjects)
            {
                manifest.gameObjects.Add(SerializeGameObject(go));
            }

            var json = JsonUtility.ToJson(manifest, true);

            if (!Directory.Exists(_outputPath))
            {
                Directory.CreateDirectory(_outputPath);
            }

            var filePath = Path.Combine(_outputPath, $"{scene.name}_manifest.json");
            File.WriteAllText(filePath, json, Encoding.UTF8);

            AssetDatabase.Refresh();
            Debug.Log($"[BlueWirks] Scene manifest exported to: {filePath}");
            EditorUtility.DisplayDialog("Export Complete", $"Manifest saved to:\n{filePath}", "OK");
        }

        private GameObjectData SerializeGameObject(GameObject go)
        {
            var data = new GameObjectData
            {
                name = go.name,
                tag = go.tag,
                layer = LayerMask.LayerToName(go.layer),
                components = new List<ComponentData>(),
                children = new List<GameObjectData>()
            };

            foreach (var component in go.GetComponents<Component>())
            {
                if (component == null) continue;
                data.components.Add(new ComponentData
                {
                    type = component.GetType().Name
                });
            }

            for (int i = 0; i < go.transform.childCount; i++)
            {
                data.children.Add(SerializeGameObject(go.transform.GetChild(i).gameObject));
            }

            return data;
        }

        // --- Data Classes ---

        [System.Serializable]
        private class SceneManifest
        {
            public string sceneName;
            public string unityVersion;
            public List<GameObjectData> gameObjects;
        }

        [System.Serializable]
        private class GameObjectData
        {
            public string name;
            public string tag;
            public string layer;
            public List<ComponentData> components;
            public List<GameObjectData> children;
        }

        [System.Serializable]
        private class ComponentData
        {
            public string type;
        }
    }
}
