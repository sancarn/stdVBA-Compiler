# stdVBA-Compiler

VBA-like source to VBA source code compiler

## Motivation

VBA first appeared in 1993 (over 25 years ago) and the language's age is definitely noticable. VBA has a lot of specific libraries for controlling Word, Excel, Powerpoint etc. However the language massively lacks in generic modern libraries for accomplishing common programming tasks. VBA projects ultimately become a mish mash of many different technologies and programming styles. Commonly for me that means calls to Win32 DLLs, COM libraries via late-binding, calls to command line applications and calls to .NET assemblies.

Over time I have been building my own libraries over at [stdVBA](http://github.com/sancarn/stdVBA) but there comes a point where a VBA library can only do so much. Many of the additional functionalities we would like to add are near impossible, or rely on undocumented behaviour of the VB Object Model. In an ideal world we wouldn't have to rely on this for our applications and would be able to rely on more stable systems.

stdVBA Compiler aims to transpile VBA-like source code into real working source code, a lot like how BabelJS implements new features to the JavaScript runtime.

### Source code

```vb
Public Sub Main()
   someSub()
   array = stdArray.create(1,2,3)
   Debug.Print array.map(someFunc).join
End Sub
Protected Sub someSub()
  Application.SomeOption = true
End Sub
Private Function someFunc(ByVal el as long) as long
  return el*2
End Function
```

### Transpiled content:

```vb
Public Sub Main()
  Call stdError.addStack("ModuleMain::Main()")
    Call zProtSomeSub()
    set array = stdArray.create(1,2,3)
    Debug.Print array.map(stdCallback.CreateFromModule("ModuleMain","someFunc")).join
  Call stdError.popStack
End Sub
Public Sub zProtSomeSub()
  Call stdError.addStack("ModuleMain::someSub()")
    Application.SomeOption = true
  Call stdError.popStack
End Sub
Private Function someFunc(ByVal el as long) as long
  Call stdError.addStack("ModuleMain::someFunc()")
    someFunc = el*2
  Call stdError.popStack
End Function
```


