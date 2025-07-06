import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 24 },
  heading: { fontSize: 20, fontWeight: 'bold', textAlign: 'left' },
  inputBox: { padding: 12, backgroundColor: '#fff', margin: 12, borderRadius: 8, elevation: 2 },
  input: { borderWidth: 1, marginBottom: 8, padding: 8, borderRadius: 4, backgroundColor: 'white' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  previewBox: { padding: 12, marginHorizontal: 12, marginBottom: 8, backgroundColor: '#e7f7ee', borderRadius: 8 },
  previewTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  mapContainer: { flex: 1, overflow: 'hidden', borderRadius: 12, margin: 12, backgroundColor: '#eee' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuBox: {
    backgroundColor: '#fff',
    marginTop: 54,
    marginRight: 16,
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  statusBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
});
