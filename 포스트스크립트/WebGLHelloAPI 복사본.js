var gl; //전역변수 생성-es랑 비슷한 느낌 만들수 잇음

function testGLError(functionLastCalled) { 
    //gl은 에러가나면 그냥진행한다. ex-배틀그라운드 -최근에 발생한 에러 lasterror에 저장

    var lastError = gl.getError();

    if (lastError != gl.NO_ERROR) {
        alert(functionLastCalled + " failed (" + lastError + ")");
        return false;
    }

    return true;
}

function initialiseGL(canvas) {
    try {//일단해봐
        // Try to grab the standard context. If it fails, fallback to experimental
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        // 캔버스가 파라메타로 넘어옴 getcontext-거대한 스테이트들의 모임을 컨텍스트라고함.
        // 컨텍스트를 받기위해 바로 위의 레이어에 요청함. 그것이 캔버스이다.
        // webgl을 사용하겟다.
        // || 가 들어간 이유는 앞에게 안되면 뒤에꺼를 실행해라. webgl의 일부분만 지원하는 브라우저를위해
        gl.viewport(0, 0, canvas.width, canvas.height);
        //html에서 지정한 500,800등의 크기.- 여기서만 줄이면 화면은 그대로이고, 그림만 줄어든다.
        //그림의 일부분만 사용가능하다.-클리핑
    }
    catch (e) {
    }

    if (!gl) {
        alert("Unable to initialise WebGL. Your browser may not support it");
        return false;//webgl호출 실패시
    }

    return true;
}

function initialiseBuffer() {

    var vertexData = [//   cpu의 메인메모리에 있음.
        -0.4, -0.4, 0.0,  1.0, 0.0, 0.0 ,1.0,// Bottom left
         0.4, -0.4, 0.0,  0.0, 1.0, 0.0, 1.0,// Bottom right
         0.0, 0.4, 0.0,  0.0, 0.0, 1.0, 1.0, // Top middle
         0.0, 0.0, 0.0,  1.0, 1.0, 1.0, 1.0,
         0.5, 0.0, 0.0,  1.0, 1.0, 1.0, 1.0,
         0.25, 0.7, 0.0,  0.0, 0.0, 0.0, 1.0
    ];

    
    gl.vertexBuffer = gl.createBuffer();
    //gl은 웹지엘 컨텍스트이다. 버퍼가 이미 있다는 뜻이다.-컨텍스트 연결하면 자동으로 생김
    //크리에이트버퍼 - 버퍼를 만든다 - 포인트오브젝트를 만들어 어사인함
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
    //쓰기위해선 바인딩을 해야한다. 쓰기전에 바인딩
    //gl어레이버퍼에 바인딩. 어레이버퍼 or 엘리먼트버퍼가 들어갈 수 있다.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    //뒤에 데이터가 붙어있으면 데이터를 샌딩한다. 어레이 버퍼에 보낸다-버텍스테이터를 보낸다.
    //스테틱드로우로 진행-힌팅
    //cpu->gpu M 으로 보내는 과정. 한번 보내면 더이상 보낼 필요가 없다.
    return testGLError("initialiseBuffers");
}

var shaderProgram;


function initialiseShaders() { 


    var fragmentShaderSource = '\
			varying highp vec4 col;\
            void main(void) \
			{ \
				gl_FragColor = vec4(1.0,0.0,0.0,1.0); \
			}';
            //vec의 칼라를 결정하는 프로그램
    // c언어로 프로그램 되어있음.

    gl.fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    //크리에이트
    // Load the source code into it
    gl.shaderSource(gl.fragShader, fragmentShaderSource);
    //쉐이더에 코드를 넣는다. - 이미 떠나버림.
    // Compile the source code
    gl.compileShader(gl.fragShader);
    //웹지엘에 컴파일러들이 있음
    // Check if compilation succeeded
    if (!gl.getShaderParameter(gl.fragShader, gl.COMPILE_STATUS)) {
        // 쉐이딩이 잘 되었는지 확인-컴파일이 되엇는지 확인.
        alert("Failed to compile the fragment shader.\n" + gl.getShaderInfoLog(gl.fragShader));
        return false;
    }

    /*	Concept: Vertex Shaders
        Vertex shaders primarily exist to allow a developer to express how to orient vertices in 3D space, through transformations like 
        Scaling, Translation or Rotation. Using the same basic layout and structure as a fragment shader, these take in vertex data and 
        output a fully transformed set of positions. Other inputs are also able to be used such as normals or texture coordinates, and can 
        also be transformed and output alongside the position data.
    */

    // Vertex shader code

    var vertexShaderSource = '\
			attribute highp vec4 myVertex; \ 
            attribute highp vec4 myColor; \
            varying highp vec4 col;\
			uniform mediump mat4 transformationMatrix; \
			void main(void)  \
			{ \
                col = myColor;\
				gl_Position = transformationMatrix * myVertex; \
			}';
            //트랜스폼 - 메트릭스는 외부에서 받아온다.
            //어트리뷰트는 좌표 맨 마지막에 1을 넣어준다 - 호모지니어스 코디네이트.

    // Create the vertex shader object
    gl.vertexShader = gl.createShader(gl.VERTEX_SHADER);

    // Load the source code into it
    gl.shaderSource(gl.vertexShader, vertexShaderSource);

    // Compile the source code
    gl.compileShader(gl.vertexShader);

    // Check if compilation succeeded
    if (!gl.getShaderParameter(gl.vertexShader, gl.COMPILE_STATUS)) {
        // It didn't. Display the info log as to why
        alert("Failed to compile the vertex shader.\n" + gl.getShaderInfoLog(gl.vertexShader));
        return false;
    }

    // Create the shader program
    gl.programObject = gl.createProgram();

    // Attach the fragment and vertex shaders to it
    gl.attachShader(gl.programObject, gl.fragShader);
    gl.attachShader(gl.programObject, gl.vertexShader);
    //쉐이더 두개를 묶어 어테치를 한다. 


    // Bind the custom vertex attribute "myVertex" to location 0
    gl.bindAttribLocation(gl.programObject, 0, "myVertex");
    gl.bindAttribLocation(gl.programObject, 1, "myColor");
    //바인딩을 한다.


    // Link the program
    gl.linkProgram(gl.programObject);

    // Check if linking succeeded in a similar way we checked for compilation errors
    if (!gl.getProgramParameter(gl.programObject, gl.LINK_STATUS)) {
        alert("Failed to link the program.\n" + gl.getProgramInfoLog(gl.programObject));
        return false;
    }

    /*	Use the Program
        Calling gl.useProgram tells WebGL that the application intends to use this program for rendering. Now that it's installed into
        the current state, any further gl.draw* calls will use the shaders contained within it to process scene data. Only one program can
        be active at once, so in a multi-program application this function would be called in the render loop. Since this application only
        uses one program it can be installed in the current state and left there.
    */
    gl.useProgram(gl.programObject);
    //프로그램이 시작된다.

    return testGLError("initialiseShaders");
}

var rrr = 0.0;
var rinc = 0.00;

function renderScene() {
    
    gl.clearColor(rrr, 0.0, 0.0, 1.0);
     rrr = rrr + rinc;
     if(rrr > 1.0) 
        rinc = -0.01;
     if(rrr < 0.0) 
        rinc = 0.01;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Get the location of the transformation matrix in the shader using its name
    var matrixLocation = gl.getUniformLocation(gl.programObject, "transformationMatrix");
    //유니폼을 받아온다.
    var colLocation = gl.getUniformLocation(gl.programObject, "col");
    // Matrix used to specify the orientation of the triangle on screen
    var transformationMatrix = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];//트랜스폼 매트릭스

    var cColor = [1.0, 0.0, 0.0, 1.0];
    // Pass the identity transformation matrix to the shader using its location
    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, transformationMatrix);

    if (!testGLError("gl.uniformMatrix4fv")) {
        return false;
    }

    gl.enableVertexAttribArray(0);
    //버퍼가 한개이니 0을 써줫다.
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 28, 0);
    
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, gl.FALSE, 28, 12);

    gl.vetexATTRib4f(1, 1.0, 0.0, 0.0, 1.0);
    //
    //
    if (!testGLError("gl.vertexAttribPointer")) {
        return false;
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    //버텍스를 0번부터 3개를 쓴다 - 삼각형
    //드로우명령

    if (!testGLError("gl.drawArrays")) {
        return false;
    }

    return true;
}

function main() {
    var canvas = document.getElementById("helloapicanvas"); 
    // 지역변수 캔버스와 helloapicanvas는 html에서의 id 와 같아야함

    if (!initialiseGL(canvas)) {//트루펄스 리턴- 에러발생시 리턴해버림
        return;
    }

    if (!initialiseBuffer()) {//트루펄스 리턴- 에러발생시 리턴해버림
        return;
    }

    if (!initialiseShaders()) {//트루펄스 리턴- 에러발생시 리턴해버림
        return;
    }

    // Render loop - 매우복잡함
    requestAnimFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
			function (callback) {
			    window.setTimeout(callback, 1000, 60);
			};
    })();

    (function renderLoop() {
        if (renderScene()) {
            // Everything was successful, request that we redraw our scene again in the future
            requestAnimFrame(renderLoop);//무한루프로 일정시간마다 랜더신을 발생시킨다.
        }
    })();
}
