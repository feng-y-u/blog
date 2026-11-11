---
title: Datetime，collections和argparse
category: 学习
tags: [Python, 学习]
coverImage: /images/Datetime，collections和argparse.webp
coverPosition: 67% 24%
---

## Datetime

datetime用来处理日期和时间

使用datetime.now()语句获取当前的datetime，类型是datetime。
```plain
>>> from datetime import datetime
>>> now = datetime.now() # 获取当前datetime
>>> print(now)
2015-05-18 16:28:07.198690
>>> print(type(now))
<class 'datetime.datetime'>
```

创建指定日期和时间的datetime：
```plain
>>> from datetime import datetime
>>> dt = datetime(2015, 4, 19, 12, 20) # 用指定日期时间创建datetime
>>> print(dt)
2015-04-19 12:20:00
```

计算机内部的时间都是由timestamp（时间戳）来表示的，1970年1月1日 UTC + 00:00:00时区的时刻称为epoch time,即为timestamp = 0.

把一个datetime类型转换为timestamp只需要调用timestamp()方法：
```plain
>>> from datetime import datetime
>>> dt = datetime(2015, 4, 19, 12, 20) # 用指定日期时间创建datetime
>>> dt.timestamp() # 把datetime转换为timestamp
1429417200.0
```

Python的timestamp是一个浮点数，整数位表示秒

使用datetime提供的fromtimestamp()方法将timestamp转换为datetime
```python
>>>print("Converted back to datetime:", datetime.fromtimestamp(ts))
Converted back to datetime: 2023-01-01 12:00:00
```

本地时间默认当前操作系统设定的时区

大部分情况下，用户输入的日期和时间是字符串，使用datetime.strptime()实现转换str为datetime
```
>>>parsed_day = datetime.strptime("2023-01-01 12:00:00", "%Y-%m-%d %H:%M:%S")
>>>print("Parsed datetime:", parsed_day)
Parsed datetime: 2023-01-01 12:00:00
```

到[Python官网](https://docs.python.org/3/library/datetime.html#strftime-strptime-behavior)查看具体的日期和时间格式，不过转换后的datetime是没有时区信息的。%Z可以附带时区

使用datetime的strftime()方法，将datetime转换为str字符串，同样需要一个日期和时间的格式化字符串。
```
>>>str = dt.strftime("%Y-%m-%d %H:%M:%S")
>>>print("Formatted datetime:", str)
Formatted datetime: 2023-01-01 12:00:00
```

datetime可以进行加减运算，得到新的datetime，只要导入timedelta这个类：
```python
>>> now
datetime.datetime(2026, 10, 9, 9, 33, 20, 484462)
>>> now + timedelta(hours=10)
datetime.datetime(2026, 10, 10, 9, 33, 20, 484462)
```

转换时区，datetime类型有一个时区属性`tzinfo`，默认为None。
```
>>>print(now.tzinfo)
None
```

可以通过utcnow()方法拿到当前的UTC时间，再转换为任意时区的时间，不过utcnow()返回的是虽然是UTC时间，但是对象不包含时区信息，所以已经被弃用了。

python3.11以上版本：
```
from datetime import datetime, UTC

# 直接生成带时区信息的 UTC 时间
utc_dt = datetime.now(UTC)
```

时区转换可以用ZoneInfo模块，于Python3.9引入。

```
beijing_dt = utc_dt.astimezone(ZoneInfo("Asia/Shanghai"))
#直接将UTC时刻用Shanghai时区的规则表达
```

## collections

collections是集合模块

namedtuple是一个函数，它用来创建一个自定义的tuple对象，可以规定tuple元素的个数，并且可以用属性而不是索引来引用tuple的元素

```python
>>> from collections import namedtuple
>>> Point = namedtuple('Point', ['x', 'y'])
>>> p = Point(1, 2)
>>> p.x
1
```

namedtuple创建的对象是tuple的子类,可以使用isinstance验证。


deque是为了高效实现插入和删除的双向列表，适用于队列和栈，

支持appendleft()和popleft()两种操作，可以高效地增加或删除头部元素。


defaultdict可以用来给一个dict设置key不存在时返回的默认值

```
dd = defaultdict(lambda: 'N/A')

>>> dd['key2'] # key2不存在，返回默认值
'N/A'
```

默认值是调用函数返回的。


使用OrderedDict创建出的dict的key是有序的，会按照插入的顺序排序。不过现在python3.7以后普通字典也保留插入顺序。

OrderedDict可以实现一个FIFO弹出的dict。


ChainMap可以把一组dict合并成为一个新的逻辑上的dict,但是查找的时候，会按照顺序在内部的dict里查找。

合成的大字典不等于拼接，比如拼接后的大字典里可以存在相同的键key,而使用重复的键key时得到的Value是大字典里位置靠前的Value.

ChainMap可以实现参数的优先级查找
```
from collections import ChainMap
import os,argparse

defaults = {'color': 'red', 'user': 'guest'}

parser = argparse.ArgumentParser()
parser.add_argument('-c', '--color', help='color of the item')
parser.add_argument('-u', '--user', help='username')
namespace = parser.parse_args()
command_line_args = {k: v for k, v in vars(namespace).items() if v is not None}

combined = ChainMap(command_line_args, os.environ, defaults)
```

Counter是简单的计数器，它以元素为键，以出现次数为值

传入字符串，会统计字符，传入列表，统计元素。
```
>>> from collections import Counter
>>> c = Counter('programming')

>>> c
Counter({'g': 2, 'm': 2, 'r': 2, 'a': 1, 'i': 1, 'o': 1, 'n': 1, 'p': 1})
```

不过，Counter的本质还是dict字典

# argparse

Python内置的sys.argv保存了完整的命令行参数列表，可以从中解析出命令行参数。

使用内置的argparse库，定义好各个参数类型，可以直接返回有效的参数

```python
#backup.py
import argparse
def main():
    #argparse.ArgumentParser创建的实例是一个解析器对象
    #1.记录允许用户输入的参数
    #2.读取用户实际输入的参数
    #3.把输入翻译成为可用的数据
    parser = argparse.ArgumentParser(
        prog='backup',
        description='Backup MySQL databases to a specified directory.',
        epilog='Example usage: python backup.py --host localhost --user root --password mypassword --databases db1 db2 --backup-dir /path/to/backup'
    )
    #位置参数
    parser.add_argument('outfile')
    #关键字参数
    parser.add_argument('--host', default='localhost', help='MySQL host (default: localhost)')
    parser.add_argument('--port', type=int, default=3306, help='MySQL port (default: 3306)')
    parser.add_argument('-u','--user', required=True, help='MySQL username')
    parser.add_argument('-p','--password', required=True, help='MySQL password')
    parser.add_argument('-d','--databases', nargs='+', required=True, help='List of databases to backup')  
    parser.add_argument('-g', '--gzcompress', action='store_true',help='Compress backup files by gz.')


    #解析参数：
    args = parser.parse_args()
    print(f"Backing up databases {args.databases} from {args.host}:{args.port} as user {args.user} to {args.outfile}")


if __name__== '__main__':
    main()
```

## argparse 常用参数

- `type=int`：把命令行字符串转成整数，`--port 3306` 得到 `3306`。
- `nargs='+'`：一个参数收多个值，`-d db1 db2` 得到 `['db1', 'db2']`。
- `action='store_true'`：开关参数，出现是 `True`，不出现是 `False`。
- `required=True`：必须传，缺了会报错并以退出码 2 结束。
- 运行 `python backup.py --help` 可以看 argparse 自动生成的帮助。

---

## 相关笔记

- 图谱：[[实习/Python/00-Python知识地图|Python 知识地图]]
- 前置：[[模块]]
- 关联：[[IO编程]]（JSON / 序列化）、[[进程与线程]]（argparse 写脚本参数）
