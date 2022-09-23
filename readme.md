# [`Arrify`]:源码共读

## 前言

**本文参加了由**[公众号@若川视野](https://link.juejin.cn/?target=https%3A%2F%2Flxchuan12.gitee.io) **发起的每周源码共读活动，** [点击了解详情一起参与。](https://juejin.cn/post/7079706017579139102)

**这是源码共读的第33期，链接：[第33期 | arrify 转数组](https://juejin.cn/post/7100218384918249503)**

## 介绍

### `Arrify`是什么

> 将一个值转化为一个数组

```javascript
import arrify from 'arrify';
arrify('🦄');
//=> ['🦄']
arrify(['🦄']);
//=> ['🦄']
arrify(new Set(['🦄']));
//=> ['🦄']
arrify(null);
//=> []
arrify(undefined);
//=> []
```

我的理解是：**他就是将可以转化为数组的value放到了数组里**，对于一些空值，直接使用`[]`

## 源码

### 准备源码

```bash
git clone https://github.com/sindresorhus/arrify.git
```

```bash
npm install arrify
```

### 查看依赖

```json
{
    ...,
    "scripts": {
		"test": "xo && ava && tsd"
	},
}
```

#### `XO`

> 一个开箱即用的`linter`,底层使用的是`Eslint`,他不用去管`.eslintrc`

#### `tsd`

> 检查`TS`里的一些类型定义，为类型定义编写测试

#### `ava`

> `Node.js`环境下的测试运行器

**这边我还没看明白，对于这几个库干啥的，后续再看吧**

### 代码

```javascript
export default function arrify(value) {
	if (value === null || value === undefined) {
		return [];
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value === 'string') {
		return [value];
	}

	if (typeof value[Symbol.iterator] === 'function') {
		return [...value];
	}

	return [value];
}
```

#### 转换规则

1. 首先是将`null`或者`undefined`转化为空的数组
2. 其次是对于数组，那么它不需要转换
3. 对于String，它本身就是可迭代的,**我们将他作为一个整体放进去**
4. 对于可迭代的，那么浅拷贝创建新的数组
5. 其他类型，直接是空的对象

#### 重点

##### `Symbol.iterator`

> 为每一个对象定义一个默认的迭代器

简单说，就是可以进行`for..of`,`解构赋值操作`

对于`String`,`Array`，`Map`，`Set`等，他们就是默认就具有这种迭代器的，意思就是，这个对象你必须有一个属性，并且属性名为`Symbol.iterator`

```javascript
const arr = new Array()
arr = [1,2,3,4]
console.log(arr)
```

```javascript
length: 4
[[Prototype]]: 
ƒ values()
Symbol(Symbol.iterator): ƒ values()
length: 0
name: "values"
arguments: [异常:TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them at Function.invokeGetter (<anonymous>:3:28)]
caller: [异常:TypeError: 'caller', 'callee', and 'arguments' properties may not be accessed on strict mode functions or the arguments objects for calls to them at Function.invokeGetter (<anonymous>:3:28)]
[[Prototype]]: ƒ ()
[[Scopes]]: Scopes[0]
Symbol(Symbol.unscopables): {at: true, copyWithin: true, entries: true, fill: true, find: true, …}
[[Prototype]]: Object
```

确实，对于可迭代的Array，我们身上确实有这个属性

```javascript
console.log(arr[Symbol.iterator])
```

```javascript
ƒ values() { [native code] }
```

这是我们可以知道，他其实返回的是一个函数

现在我们来调用这个函数

```javascript
const iterator = arr[Symbol.iterator]()
```

```javascript
[[Prototype]]: 
Array Iterator
next: ƒ next()
length: 0
name: "next"
arguments: (...)
caller: (...)
[[Prototype]]: ƒ ()
[[Scopes]]: Scopes[0]
Symbol(Symbol.toStringTag): "Array Iterator"
[[Prototype]]: Object
```

可以看到，它里面有一个`next`的方法

```javascript
iterator.next()
```

```javascript
{value: 1, done: false}
```

**可以看到他有两个属性，value和done**

`Value`:表示当前的值

`done`:表示是不是已经到了结尾，是一个布尔值

当我们的`done`为`true`时,也就意味着我们的迭代完成了

###### 加深一些

我们可以将迭代理解为：

1. 首先他创建了一个指针对象，指向当前数据结构的起始位置，迭代器本质是一个指针对象
2. 每次调用next方法，那么我们的指针向后移动一个
3. 直到他到达最后为止

**经过上面的理解，我们就可以直到，其实我们要判断是不是可迭代的，就可以通过`Symbol.iterator`来判断**

+ **可迭代**：`typeof value[Symbol.interator] === function`
+ **不可迭代**：那么他就会是`undefined`,**因为它自身就没有这个属性**

###### 扩展运算符

在源码里，我们看到`[...value]`

**其实扩展运算符，他其实就是在调用`iterator`这个接口**

##### 缺点

这里面他好像没有对`类数组`结构进行操作

###### 类数组特点

+ 有`length`
+ 可以通过索引访问数据
+ 但是无法使用数组的一些`api`

###### 例子

+ 你在页面DOM获取的那个列表，他就是一个类数组

###### 转换

+ 直接使用`Array.from()`
+ 或者使用`Array.prototype.slice.call(类数组)`

类似于这种的还有`解构赋值操作`,`yield*`,`Array.form()`等

##### 补充

刚刚我们上面提到的`iterator`被我们成为迭代器，那么提到迭代器，我们也可以聊聊生成器

###### 生成器（Generator）

```javascript
function* generator(i) {
  yield i;
  yield i + 10;
}
```

一般生成器都是这种形式来进行声明的

其实我们可以将`Genderator`理解为**一个状态机，每次的`yield`都是他的一个状态**，我们可以使用`generator.next().value`可以获取里的值

调用

```javascript
const test = generator(10);
```

这里面获得的其实是一个指针，他只想了最前面那个状态，他不会有任何的输出，只有当你`next`，他才会去执行`yield`里面的代码

```javascript
t.next();//{value: 10, done: false}
```

和`iterator`类似，他也是会有一个对象，里面有两个属性，一个表示当前状态的值，一个表示是否已经到达最后

**`Genderator`其实就是我们的迭代器的生成函数,也就是我们完全可以定义一个`Genderator`,然后按照我们的想法进行迭代**

例如：

> 我们希望每次迭代，value+2

```javascript
function* addTwo(){
    let index = 0;
    while(true)
        yield index = index+2;
}
const arr = [1,2,3,4];
//绑定到迭代器上
arr[Symbol.iterator] = addTwo;
//调用我们的迭代器
const iterator = arr[Symbol.iterator]()
//调用上面的next属性
iterator.next()//{value: 2, done: false}
iterator.next()//{value: 4, done: false}
iterator.next()//{value: 6, done: false}
```

##### `Array.isArray`

`Array.isArray()`用于确定传递的值是不是一个`Array`

如果传入的值是`array`,那么返回的值就是`true`,否则就是`false`

```javascript
Array.isArray([1, 2, 3]);  // true
Array.isArray({foo: 123}); // false
Array.isArray('foobar');   // false
Array.isArray(undefined);  // false
```

## 感悟

1. 之前也了解了一点`iterator`，但是现在啥也没记住，这次将我的想法写了下来，感觉没有之前那么迷惑了

2. 知道了一些`npm`包，如`tsd`,`ava`

   我觉得大概就是：

   + `tsd`:是对类型进行测试的，你不可以`import`啥的就可以直接使用，也同样具有语法提示
   + `ava`:就是就是用于测试运行器

   这个没怎么看🤦‍♀️