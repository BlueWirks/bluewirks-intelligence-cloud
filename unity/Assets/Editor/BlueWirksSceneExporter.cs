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
            var sceneAudioListeners = Object.FindObjectsByType<AudioListener>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            var sceneHasAudioListener = sceneAudioListeners != null && sceneAudioListeners.Length > 0;

            if (!Directory.Exists(_outputPath))
            {
                Directory.CreateDirectory(_outputPath);
            }

            var filePath = Path.Combine(_outputPath, $"{scene.name}_manifest.json");
            var previousManifest = LoadPreviousManifest(filePath);

            var manifest = new SceneManifest
            {
                manifestVersion = "2.0",
                sceneName = scene.name,
                scenePath = scene.path,
                unityVersion = Application.unityVersion,
                buildTarget = EditorUserBuildSettings.activeBuildTarget.ToString(),
                exportedAtUtc = System.DateTime.UtcNow.ToString("o"),
                gameObjects = new List<GameObjectData>(),
                findings = new List<FindingData>()
            };

            if (sceneAudioListeners != null && sceneAudioListeners.Length > 1)
            {
                manifest.findings.Add(new FindingData
                {
                    severity = "warning",
                    code = "MULTIPLE_AUDIO_LISTENERS",
                    message = $"Scene has {sceneAudioListeners.Length} AudioListeners; Unity recommends exactly one active listener.",
                    objectPath = "<scene>"
                });
            }

            foreach (var go in rootObjects)
            {
                var rootPath = go.name;
                manifest.gameObjects.Add(SerializeGameObject(go, rootPath, manifest.findings, sceneHasAudioListener));
            }

            PopulateDiffSummary(manifest, previousManifest);

            var json = JsonUtility.ToJson(manifest, true);
            File.WriteAllText(filePath, json, Encoding.UTF8);

            AssetDatabase.Refresh();
            Debug.Log($"[BlueWirks] Scene manifest exported to: {filePath}");
            EditorUtility.DisplayDialog("Export Complete", $"Manifest saved to:\n{filePath}", "OK");
        }

        private SceneManifest LoadPreviousManifest(string filePath)
        {
            if (!File.Exists(filePath))
            {
                return null;
            }

            try
            {
                var previousJson = File.ReadAllText(filePath, Encoding.UTF8);
                return JsonUtility.FromJson<SceneManifest>(previousJson);
            }
            catch
            {
                return null;
            }
        }

        private void PopulateDiffSummary(SceneManifest current, SceneManifest previous)
        {
            if (current == null)
            {
                return;
            }

            var currentObjectCount = CountGameObjects(current.gameObjects);
            var currentComponentCount = CountComponents(current.gameObjects);
            var currentFindingCount = current.findings != null ? current.findings.Count : 0;

            if (previous == null)
            {
                current.diffSummary = new DiffSummaryData
                {
                    previousExportedAtUtc = null,
                    addedObjects = currentObjectCount,
                    removedObjects = 0,
                    changedComponents = currentComponentCount,
                    findingDelta = currentFindingCount
                };
                return;
            }

            var previousObjectCount = CountGameObjects(previous.gameObjects);
            var previousComponentCount = CountComponents(previous.gameObjects);
            var previousFindingCount = previous.findings != null ? previous.findings.Count : 0;

            current.diffSummary = new DiffSummaryData
            {
                previousExportedAtUtc = previous.exportedAtUtc,
                addedObjects = Mathf.Max(0, currentObjectCount - previousObjectCount),
                removedObjects = Mathf.Max(0, previousObjectCount - currentObjectCount),
                changedComponents = currentComponentCount - previousComponentCount,
                findingDelta = currentFindingCount - previousFindingCount
            };
        }

        private int CountGameObjects(List<GameObjectData> nodes)
        {
            if (nodes == null)
            {
                return 0;
            }

            var total = 0;
            foreach (var node in nodes)
            {
                if (node == null)
                {
                    continue;
                }

                total += 1;
                total += CountGameObjects(node.children);
            }

            return total;
        }

        private int CountComponents(List<GameObjectData> nodes)
        {
            if (nodes == null)
            {
                return 0;
            }

            var total = 0;
            foreach (var node in nodes)
            {
                if (node == null)
                {
                    continue;
                }

                total += node.componentCount;
                total += CountComponents(node.children);
            }

            return total;
        }

        private GameObjectData SerializeGameObject(GameObject go, string path, List<FindingData> findings, bool sceneHasAudioListener)
        {
            var data = new GameObjectData
            {
                name = go.name,
                path = path,
                tag = go.tag,
                layer = LayerMask.LayerToName(go.layer),
                activeSelf = go.activeSelf,
                activeInHierarchy = go.activeInHierarchy,
                isStatic = go.isStatic,
                prefabAssetPath = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(go),
                localPosition = new Vector3Data(go.transform.localPosition),
                localRotation = new QuaternionData(go.transform.localRotation),
                localScale = new Vector3Data(go.transform.localScale),
                components = new List<ComponentData>(),
                children = new List<GameObjectData>()
            };

            var missingScriptCount = 0;
            var hasRenderer = false;
            var hasCollider3D = false;
            var hasCollider2D = false;
            var hasCamera = false;
            var hasAudioListener = false;

            foreach (var component in go.GetComponents<Component>())
            {
                if (component == null)
                {
                    missingScriptCount += 1;
                    continue;
                }

                if (component is Renderer) hasRenderer = true;
                if (component is Collider) hasCollider3D = true;
                if (component is Collider2D) hasCollider2D = true;
                if (component is Camera) hasCamera = true;
                if (component is AudioListener) hasAudioListener = true;

                data.components.Add(new ComponentData
                {
                    type = component.GetType().Name
                });
            }

            data.componentCount = data.components.Count;
            data.missingScriptCount = missingScriptCount;

            if (missingScriptCount > 0)
            {
                findings.Add(new FindingData
                {
                    severity = "error",
                    code = "MISSING_SCRIPT",
                    message = $"{go.name} has {missingScriptCount} missing script reference(s).",
                    objectPath = path
                });
            }

            if (hasRenderer && !hasCollider3D && !hasCollider2D)
            {
                findings.Add(new FindingData
                {
                    severity = "warning",
                    code = "RENDERER_NO_COLLIDER",
                    message = $"{go.name} has a Renderer but no Collider.",
                    objectPath = path
                });
            }

            if (hasCamera && !hasAudioListener && !sceneHasAudioListener)
            {
                findings.Add(new FindingData
                {
                    severity = "warning",
                    code = "CAMERA_NO_AUDIO_LISTENER",
                    message = $"Camera object {go.name} has no AudioListener and none found in scene.",
                    objectPath = path
                });
            }

            var childNameCounts = new Dictionary<string, int>();
            for (int i = 0; i < go.transform.childCount; i++)
            {
                var child = go.transform.GetChild(i).gameObject;
                if (!childNameCounts.ContainsKey(child.name))
                {
                    childNameCounts[child.name] = 0;
                }

                childNameCounts[child.name] += 1;
            }

            for (int i = 0; i < go.transform.childCount; i++)
            {
                var child = go.transform.GetChild(i).gameObject;
                var childPath = $"{path}/{child.name}";

                if (childNameCounts[child.name] > 1)
                {
                    findings.Add(new FindingData
                    {
                        severity = "info",
                        code = "DUPLICATE_SIBLING_NAME",
                        message = $"Duplicate sibling name '{child.name}' under {path}.",
                        objectPath = childPath
                    });
                }

                data.children.Add(SerializeGameObject(child, childPath, findings, sceneHasAudioListener));
            }

            var isRoot = go.transform.parent == null;
            if (isRoot && data.componentCount == 0 && data.children.Count == 0)
            {
                findings.Add(new FindingData
                {
                    severity = "info",
                    code = "EMPTY_ROOT_OBJECT",
                    message = $"Root object {go.name} has no components and no children.",
                    objectPath = path
                });
            }

            return data;
        }

        // --- Data Classes ---

        [System.Serializable]
        private class SceneManifest
        {
            public string manifestVersion;
            public string sceneName;
            public string scenePath;
            public string unityVersion;
            public string buildTarget;
            public string exportedAtUtc;
            public List<GameObjectData> gameObjects;
            public List<FindingData> findings;
            public DiffSummaryData diffSummary;
        }

        [System.Serializable]
        private class GameObjectData
        {
            public string name;
            public string path;
            public string tag;
            public string layer;
            public bool activeSelf;
            public bool activeInHierarchy;
            public bool isStatic;
            public string prefabAssetPath;
            public Vector3Data localPosition;
            public QuaternionData localRotation;
            public Vector3Data localScale;
            public int componentCount;
            public int missingScriptCount;
            public List<ComponentData> components;
            public List<GameObjectData> children;
        }

        [System.Serializable]
        private class ComponentData
        {
            public string type;
        }

        [System.Serializable]
        private class FindingData
        {
            public string severity;
            public string code;
            public string message;
            public string objectPath;
        }

        [System.Serializable]
        private class DiffSummaryData
        {
            public string previousExportedAtUtc;
            public int addedObjects;
            public int removedObjects;
            public int changedComponents;
            public int findingDelta;
        }

        [System.Serializable]
        private class Vector3Data
        {
            public float x;
            public float y;
            public float z;

            public Vector3Data() { }

            public Vector3Data(Vector3 value)
            {
                x = value.x;
                y = value.y;
                z = value.z;
            }
        }

        [System.Serializable]
        private class QuaternionData
        {
            public float x;
            public float y;
            public float z;
            public float w;

            public QuaternionData() { }

            public QuaternionData(Quaternion value)
            {
                x = value.x;
                y = value.y;
                z = value.z;
                w = value.w;
            }
        }
    }
}
