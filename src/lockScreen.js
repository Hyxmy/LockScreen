(function(){

	/**
	 * 函数作用：创建一个lockScreen对象
	 */
	window.lockScreen = function(obj){ 
		this.width = obj.width;
		this.height = obj.height;
		this.container = obj.container;
	}

	/**
	 * 函数作用：初始化canvas
	 */
	lockScreen.prototype.initDom = function(){
		var wrap = document.getElementById(this.container);
		var str = '<canvas id="canvasLock" width="'+this.width+'" height="'+this.height+'" style="display: inline-block;"></canvas>';
		wrap.innerHTML = str;
	}

	/**
	 * 函数作用：初始化radios
	 * 备注：若localStorage里没有密码，则不能选择验证密码按钮
	 */
	lockScreen.prototype.initRadios = function(){
		this.setS = 1;
		this.checkS = 0;
		document.getElementById('lWarning').innerHTML = '<span>请输入手势密码</span>';
		if(!window.localStorage.getItem('pwd')){
			var cp = document.getElementById('checkPwd');
			cp.addEventListener("click",function(e){
				e.preventDefault();
				document.getElementById('lWarning').innerHTML = '<span style="color:red">你还没有设置密码哦</span>';
			})
		}
	}

	/**
	 * 函数作用：以(x,y)为圆心，r为半径画空心圆
	 * 备注：画圆 arc(x, y, radius, startAngle, endAngle, anticlockwise)
	 */
	lockScreen.prototype.drawCircle = function(x,y){
		this.r = 20;
		var ctx = this.ctx;
		ctx.beginPath();
		ctx.strokeStyle = '#aaa';
		ctx.arc(x,y,this.r,0,Math.PI*2,true);
		ctx.stroke();
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.arc(x,y,this.r-1,0,Math.PI*2,true);
		ctx.fill();
	}

	/**
	 * 函数作用：以(x,y)为圆心，r为半径画实心圆
	 */
	lockScreen.prototype.drawPoint = function(x,y){
		var ctx = this.ctx;
		ctx.beginPath();
		ctx.fillStyle = 'orange';
		ctx.arc(x,y,this.r,0,Math.PI*2,true);
		ctx.fill();
	}

	/**
	 * 函数作用：将两点连线
	 */
	lockScreen.prototype.drawLine = function(pr,cu){
		var ctx = this.ctx;
		ctx.beginPath();
		ctx.strokeStyle = 'red';
		ctx.moveTo(pr.x,pr.y);
		ctx.lineTo(cu.x,cu.y);
		ctx.stroke();
	}

	/**
	 * 函数作用：创建一个3*3的圆，并画在屏幕上
	 */
	lockScreen.prototype.createCircles = function(){
		var _self = this;
		_self.circleCenters = [];
		var n = 3;
		var w = _self.width/(n+1);
		for(var i = 1;i <= n;i++){
			for(var j = 1;j <= n;j++){
				var cricle = {
					x: w*i,
					y: w*j,
					index: _self.circleCenters.length
				};
				_self.drawCircle(cricle.x,cricle.y);
				_self.circleCenters.push(cricle);
			}
		}
	}

	/**
	 * 函数作用：根据trailPoints将经过的点按顺序填充橘色
	 */
	lockScreen.prototype.drawPoints = function(position){
		var _self = this;
		_self.restPoints.forEach(function(poi){
			if(_self.checkCricle(poi,position)){
				var pre = _self.trailPoints.slice().pop();
				_self.isLine(pre,poi);
				_self.trailPoints.push(poi);
				var tar = _self.restPoints.indexOf(poi);
				_self.restPoints.splice(tar,1);
			}
		});
		_self.trailPoints.forEach(function(e){
			_self.drawPoint(e.x,e.y);
		});
	}

	/**
	 * 函数作用：根据trailPoints将经过的点按顺序连线
	 */
	lockScreen.prototype.drawLines = function(position){
		var _self = this;
		var prePoint = null;
		_self.trailPoints.forEach(function(poi){
			if(prePoint){
				_self.drawLine(prePoint,poi);
			}
			prePoint = poi;
		});
		if(_self.trailPoints){
			var finP = _self.trailPoints.slice().pop();
			_self.drawLine(finP,position);
		}
	}	

	/**
	 * 函数作用：计算该点在canvas中的位置
	 * 备注：getBoundingClientRect()返回的left、top、right和bottom相对于视口的左上角位置而言的，
	 *       如果不希望属性值随视口变化，那么只要给top、left属性值加上当前的滚动位置
	 */
	lockScreen.prototype.getPosition = function(e){
		var rectObject = e.currentTarget.getBoundingClientRect();
		var touch = e.changedTouches;
		var position = {
			x: touch[0].pageX - (rectObject.left + window.pageXOffset),
			y: touch[0].pageY - (rectObject.top + window.pageYOffset)
		}
		return position;
	}
	
	/**
	 * 函数作用：判断两点之间有没有必须经过的点
	 * 备注：如果前一个点和当前点在一条直线上，且中间相隔一个未经过点，应把中间未经过点加入轨迹点
	 */
	lockScreen.prototype.isLine = function(pre,cu){
		var _self = this;
		var lines = [[0,3,6],[1,4,7],[2,5,8],[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6]];
		var minP = Math.min(pre.index,cu.index);
		var maxP = Math.max(pre.index,cu.index);
		lines.forEach(function(line){
			if(minP == line[0] && maxP == line[2]){
				var middleP = _self.circleCenters[line[1]];
				_self.restPoints.forEach(function(pio){
					if(pio.index == middleP.index){
						_self.trailPoints.push(pio);
						var tar = _self.restPoints.indexOf(pio);
						_self.restPoints.splice(tar,1);
					}
				})			
			}
		});
	}

	/**
	 * 函数作用：动态显示解锁路径
	 * 备注：函数每运行一次，将会将页面上canvas的东西重画一遍
	 */
	lockScreen.prototype.refresh = function(position){
		var _self = this;
		_self.ctx.clearRect(0, 0, _self.ctx.canvas.width, _self.ctx.canvas.height);
		_self.createCircles();
		_self.drawPoints(position);
		_self.drawLines(_self.trailPoints,position);

	}

	/**
	 * 函数作用：检查选点的数量
	 */
	lockScreen.prototype.checkPoints = function(arr){
		if(arr.length < 5){
			document.getElementById('lWarning').innerHTML = '<span style="color:red">密码太短，至少需要5个点</span>';
			return false;
		}
		return true;
	}

	/**
	 * 函数作用：判断position点是否在以r为半径、以poi为圆心的圆内
	 */
	lockScreen.prototype.checkCricle = function(poi,position){
		return (Math.abs(poi.x - position.x)<=this.r && Math.abs(poi.y - position.y)<=this.r)? true : false;
	}

	/**
	 * 函数作用：将数组里的子元素的index属性的值串成字符串
	 */
	lockScreen.prototype.strPwd = function(arr){
		var strA = [];
		arr.forEach(function(pio){
			strA.push(pio.index);
		});
		str = strA.join(',')
		return str;
	}

	/**
	 * 函数作用：检查密码
	 */
	lockScreen.prototype.checkPwd = function(str){
		var strPwd = JSON.stringify(window.localStorage.getItem('pwd'));
		if('"'+str+'"' == strPwd){
			document.getElementById('lWarning').innerHTML = '<span>解锁成功</span>';			
		}else{
			document.getElementById('lWarning').innerHTML = '<span style="color:red">密码错误，请重新输入</span>';
		}
	}

	/**
	 * 函数作用：保存密码
	 * 备注：setS状态1为第一遍输入密码
	 *       setS状态2为第二遍输入密码
	 */
	lockScreen.prototype.savePwd = function(str){
		var _self = this;
		if(_self.setS == 1){
			_self.prpwd = _self.password;
			_self.setS = 2;
			document.getElementById('lWarning').innerHTML = '<span>请再次输入手势密码</span>';
			return ;
		}
		if(_self.setS == 2){
			if(_self.prpwd == _self.password){
				window.localStorage.setItem('pwd',str);
				document.getElementById('lWarning').innerHTML = '<span>密码已经保存</span>';
			}else{
				document.getElementById('lWarning').innerHTML = '<span style="color:red">两次输入的不一致</span>';
				setTimeout(function(){
					document.getElementById('lWarning').innerHTML = '<span>请输入手势密码</span>'
				},1000);
			}
			_self.setS = 1;
		}		
	}

	/**
	 * 函数作用：绑定事件
	 */
	lockScreen.prototype.bindEvent = function(){
		var _self = this;
		document.getElementById('checkPwd').addEventListener("click",function(e){
			document.getElementById('lWarning').innerHTML = '<span>请输入手势密码</span>';
			_self.checkS = 1;
			_self.setS = 0;
		},false);
		
		document.getElementById('setPwd').addEventListener("click",function(e){
			document.getElementById('lWarning').innerHTML = '<span>请输入手势密码</span>';
			_self.checkS = 0;
			_self.setS = 1;
		},false);

		_self.canvas.addEventListener("touchstart",function(e){
			e.preventDefault();
			_self.trailPoints = [];
			_self.restPoints = _self.circleCenters.slice();
			var position = _self.getPosition(e);
			_self.circleCenters.forEach(function(poi){
				if(_self.checkCricle(poi,position)){
					_self.drawPoint(poi.x,poi.y);
					_self.trailPoints.push(poi);
					var tar = _self.restPoints.indexOf(poi);
					_self.restPoints.splice(tar,1);
				}
			});
		},false);

		_self.canvas.addEventListener("touchmove",function(e){
			e.preventDefault();
			_self.refresh(_self.getPosition(e));
		},false);

		_self.canvas.addEventListener("touchend",function(e){
			e.preventDefault();
			_self.ctx.clearRect(0, 0, _self.ctx.canvas.width, _self.ctx.canvas.height);
			_self.createCircles();
			if(_self.checkPoints(_self.trailPoints)){
				_self.password = _self.strPwd(_self.trailPoints);
				// window.localStorage.clear();
				_self.setS ? _self.savePwd(_self.password) : _self.checkPwd(_self.password);
			}
			
		},false);
	}

	/**
	 * 函数作用：主函数
	 */
	lockScreen.prototype.init = function(){
		this.initDom();
		this.canvas = document.getElementById('canvasLock');
		this.ctx = this.canvas.getContext('2d');
		if(this.canvas.getContext){
			this.createCircles();
		}
		this.initRadios();
		this.bindEvent();
		
	}
})();