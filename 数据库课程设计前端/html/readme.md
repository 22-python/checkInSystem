*全选*
**全选**
__全选__
_全选_

>区块引用
>>嵌套引用

    tab代码块

+ 深度挖掘
- 深度挖掘
`标记`


___
# django数据库查询
1.查询所有结果

    articles = Article.objects.all()  
2.据条件查询（过滤）
    
    articles = Article.objects.filter(title__contains='Django')  
3.查询单个记录

    article = Article.objects.get(id=1)  
4.查询排序

    # 根据发布时间降序排序
    articles = Article.objects.order_by('-published_date')  
5.限制查询结果

    # 获取前 5 条文章
    articles = Article.objects.all()[:5]

### element3
