export const windowApi = {
  minimize: () => window.ipcRenderer?.invoke("window-minimize"),
  maximize: () => window.ipcRenderer?.invoke("window-maximize"),
  close: () => window.ipcRenderer?.invoke("window-close"),
};
