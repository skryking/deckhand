interface SelectFilesResult {
  success: boolean;
  filePaths?: string[];
  error?: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

export const screenshotFilesApi = {
  selectFiles: (): Promise<SelectFilesResult> =>
    window.ipcRenderer.invoke("screenshots:selectFiles") as Promise<SelectFilesResult>,

  openFolder: (filePath: string): Promise<OperationResult> =>
    window.ipcRenderer.invoke("screenshots:openFolder", filePath) as Promise<OperationResult>,

  deleteFile: (filePath: string): Promise<OperationResult> =>
    window.ipcRenderer.invoke("screenshots:deleteFile", filePath) as Promise<OperationResult>,
};
