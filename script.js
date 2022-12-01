var banner = "\n\
  ______ __  __  _____  _____ _____  _____ _____ _______ ______ _   _     \n\
 |  ____|  \\/  |/ ____|/ ____|  __ \\|_   _|  __ \\__   __|  ____| \\ | |\n\
 | |__  | \\  / | (___ | |    | |__) | | | | |__) | | |  | |__  |  \\| |  \n\
 |  __| | |\\/| |\\___ \\| |    |  _  /  | | |  ___/  | |  |  __| | . ` | \n\
 | |____| |  | |____) | |____| | \\ \\ _| |_| |      | |  | |____| |\\  | \n\
 |______|_|  |_|_____/_\\_____|_|_ \\_\\_____|_|___   |_|  |______|_| \\_|\n\
              |  ____/ __ \\|  __ \\ / ____|  ____|                       \n\
              | |__ | |  | | |__) | |  __| |__                            \n\
              |  __|| |  | |  _  /| | |_ |  __|                           \n\
              | |   | |__| | | \\ \\| |__| | |____                        \n\
              |_|    \\____/|_|  \\_\\\\_____|______|                     \n\
"                                                                      
console.log("This page is powered by:\n",banner)                                      



var ROOT = "http://picomamba-gra-emscripten-forge.auth-da651592c8a84c5ca1cf83deb28c741c.storage.gra.cloud.ovh.net/"

outputtext = document.myform.outputtext
outputtext.value = ""









default_txt = `

import picomamba


def callback(name, done, total):
    percent = 100.0 * done / total
    print(f"{name} {percent:.2f}% ({done}/{total})")


async def main():
    import sys
    sys.path.insert(0,"/home/web_user/picomamba/env/lib/python3.10/site-packages/")

    import logging
    logging.basicConfig(level=logging.DEBUG)

    dist_url = "http://picomamba-gra-emscripten-forge.auth-da651592c8a84c5ca1cf83deb28c741c.storage.gra.cloud.ovh.net"
    env_prefix = "/home/web_user/picomamba/env"

    arch_root_url = f"{dist_url}"

    arch_repodata_url = f"{dist_url}/arch_repodata_picomamba.tar_v2.bz2"
    noarch_repodata_url = f"{dist_url}/noarch_repodata_picomamba_v2.tar.bz2"

    noarch_template = (
        "https://beta.mamba.pm/get/conda-forge/noarch/{name}-{version}-{build}.tar.bz2"
    )
    pm = picomamba.PicoMamba(
        env_prefix=env_prefix,  # the name of the env
        arch_root_url=arch_root_url,  # root url for arch pkgs
        noarch_template=noarch_template,  # templated url for norach pkgs
        progress_callback=callback,  # report download progress
    )
    await pm.initialize()
    await pm.fetch_repodata(
        arch_url=arch_repodata_url,  # url for arch repodata tar.bz2 file
        noarch_url=noarch_repodata_url,  # url for noarch repodata tar.bz2 file
    )
    print("solve")
    transaction = pm.solve(["regex"])
    print("install")
    await pm.install_transaction(transaction)
    print("wait")
    await pm.wait_for_emscripten()
    from regex import search
    print(search("o","foo").end())


`





var editor = CodeMirror.fromTextArea(document.myform.inputtext, {
  lineNumbers: true,
  mode: 'python',
  //  add theme attribute like so:
  theme: 'monokai',
  extraKeys: {
        "Tab": function(cm) {
                cm.replaceSelection("   ", "end");
} }
});
editor.setSize(null, 600);

var logeditor = CodeMirror.fromTextArea(document.myform.outputtext, {
  lineNumbers: false,
  readOnly: true,
  //  add theme attribute like so:
  theme: 'monokai'
});
logeditor.setSize(null, 200);


function addToOutput(txt)
{
  logeditor.replaceRange(txt+"\n", CodeMirror.Pos(logeditor.lastLine()))
  logeditor.scrollTo(CodeMirror.Pos(logeditor.lastLine()));
  var info = logeditor.getScrollInfo();
  logeditor.scrollTo(info.left,info.top + info.height);
}

const print = (text) => {
  addToOutput(text)

}
const printErr = (text) => {
  // console.error(text)
  // these can be ignored
  //if(!text.startWith("Could not find platform dependent libraries") && ! text.startWith("Consider setting $PYTHONHOME")){
    addToOutput("ERROR: "+text)
  //}
}


window.onload = () => {
    var savedText = localStorage.getItem("text") || default_txt;
    editor.getDoc().setValue(savedText);
};



function setStatus(txt){
  if(txt.startsWith("Downloading data... ("))
  {
    var numbers = [];
    txt.replace(/(\d[\d\.]*)/g, function( x ) { var n = Number(x); if (x == n) { numbers.push(x); }  })
    var str = `Downloading data: ${numbers[0]} / ${numbers[1]}`
    addToOutput(str)
  }
}

function locateFile(name){
  console.log("locateFile",name)
  return ROOT + name
}



async function run_async_python_main(pyjs) {


    pyjs.exec(`
import asyncio
_async_done_ = [False]
_ret_code = [0]
async def main_runner():
    try:
        ret = await main()
        if ret is None:
            ret = 0
        _ret_code[0] = ret
    except Exception as e:
        _ret_code[0] = 1
        print("EXCEPTION",e)
    finally:
        global _async_done_
        _async_done_[0] = True
asyncio.ensure_future(main_runner())
    `)

    while(true)
    {
        await new Promise(resolve => setTimeout(resolve, 100));
        const _async_done_ = pyjs.eval("_async_done_[0]")
        if(_async_done_)
        {
            break;
        }
    }
    return pyjs.eval("_ret_code[0]")
                
}



async function bootstrap_pyjs(){



    console.log("bootstrap js")
    const dist_url = "http://picomamba-gra-emscripten-forge.auth-da651592c8a84c5ca1cf83deb28c741c.storage.gra.cloud.ovh.net"
    const pyjs_runtime_url = dist_url +"/pyjs_runtime_browser.js"

    function locateFileFromDist(name){
      console.log("locateFile",name)
      return dist_url + "/" + name
    }


    // const { default: createModule }  =  await import(pyjs_runtime_url);
    // console.log(createModule)
    var pyjs = await createModule({print: print,printErr:printErr,locateFile:locateFileFromDist,setStatus:setStatus});
    console.log("111")
    globalThis.pyjs = pyjs
    globalThis.EmscriptenForgeModule = pyjs
    pyjs.setStatus = setStatus
    await import(dist_url + "/python-3.10.2-h_hash_6_cpython.tar.bz2.0.js")
    await import(dist_url + "/numpy-1.21.4-py310h672cd09_0.tar.bz2.0.js")
    await import(dist_url + "/picomamba-0.3.0-py310h57b18ff_0.tar.bz2.0.js")
    var p = await pyjs['_wait_run_dependencies']();
    pyjs.ENV['PYTHONHOME'] = "/home/web_user/picomamba/env/lib/python3.10"
    await pyjs.init()
}




var Module = {};
(async function() {


    await bootstrap_pyjs();


  main_scope = pyjs.main_scope()

  let btn = document.getElementById("run_button");
  btn.disabled = false

  btn.onclick = function () {
    logeditor.getDoc().setValue("")
    var text = editor.getValue();
    localStorage.setItem("text", text)

    try{
        pyjs.exec(text, main_scope)
        run_async_python_main(pyjs)
    }
    catch (e) {
      logeditor.replaceRange(JSON.stringify(e.message)+"\n", CodeMirror.Pos(logeditor.lastLine()))
    }
  };


})();