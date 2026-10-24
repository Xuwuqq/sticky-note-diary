' ============================================================
'  便签日记 exe 版 · 备用启动方式
'  正常情况下请直接双击 便签日记.exe；
'  本文件仅在个别系统上 exe 双击异常时使用（以隐藏方式运行）。
' ============================================================
Dim fso, shell, appDir, exe
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
exe = appDir & "\便签日记.exe"
If Not fso.FileExists(exe) Then
  MsgBox "未找到 便签日记.exe，请确认它与本文件在同一文件夹。", 48, "便签日记"
  WScript.Quit
End If
shell.CurrentDirectory = appDir
shell.Run """" & exe & """", 0, False
