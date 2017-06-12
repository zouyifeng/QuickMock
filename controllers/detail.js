var app = require('express')
var router = app.Router()
var readPromise = require('../common/utils').getReadPromise

const PROJECT_LIST = '../common/jsonfile/projectList.json'
const PROJECT_DETAIL = '../common/jsonfile/projectDetail.json'


var saveName = (project, name, url, idDel) => {
	//存储文件名和url到ajaxapilist文件

	var _writePromise = new Promise((resolve, reject) => {
		readPromise(PROJECT_DETAIL)
            .then((response) => {
                var list = JSON.parse(response).dataList,
                    new_arr = idDel ? [] : [{
                        "name": name,
                        "url": url,
                        "project": project
                    }]; //如果是删除则不需要这个新的数据
                //合并json
                if (list) {
                    for (var i = 0; i < list.length; i++) {
                        //比较url，url不能重复
                        if (url != list[i].url) {
                            new_arr.push(list[i])
                            continue;
                        }
                    }
                }
                resolve(fs.writeFileSync(PROJECT_DETAIL, JSON.stringify({
                    "dataList": new_arr
                })))
            }).catch((response) => {
                resolve(fs.writeFileSync(PROJECT_DETAIL, JSON.stringify({
                    "dataList": [{
                        "name": name,
                        "project": project,
                        "url": url
                    }]
                })))
            })
	})

}

//获取一个数据文件
router.all('/detail/api/*', (req, res) => {
    //文件名称
    var jsonName = './public/jsonfile/' + req.params[0] + '.json';

    readPromise(jsonName)
        .then((response) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DEvarE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
            res.json(JSON.parse(JSON.parse(response).detail))
        }).catch((response) => {
            res.status(404);
            res.json({msg: 'no_result'});
        })
})

router.get('/detail/list/*', (req, res) => {

    readPromise(PROJECT_DETAIL)
        .then((response) => {
            var response = JSON.parse(response).dataList;
            var ret = response.filter((item, index) => {
                return item.project === req.params[0];
            })

            res.render('project_detail', {
                haveList: true,
                list: ret,
                project: req.params[0]
            })
        })
})

//存储json
router.post('/detail/save', (req, res) => {
    //文件名称 是url 英文。便于调用 ；fileName只是描述内容
    var fileName = req.body.name.replace(/\s/g, ""),
        jsonUrl = req.body.url.replace(/\s/g, ""),
        project = req.body.project.replace(/\s/g, ""),
        jsonString = req.body.data,
        jsonName = './public/jsonfile/' + jsonUrl + '.json';

    var tempArr = jsonUrl.split('/')
    tempArr.pop();

    mkdirSync('./public/jsonfile/' + tempArr.join('/'))

    if (fileName && jsonUrl) {
        var readPromise = new Promise((resolve, reject) => {
            resolve(fs.writeFileSync(jsonName, jsonString))
        });
        //把新的关系表保存到ajaxapilist
        saveName(project, fileName, jsonUrl)
        readPromise.then((response) => {
            res.json({
                success: true,
                message: "保存成功"
            })
        }).catch((response) => {
            res.json({
                success: false,
                message: response
            })
        })
    } else {
        //后台加一道拦截，防止没有文件名和url
        res.json({
            success: false,
            message: "名称或url不能为空"
        })
    }

})

//编辑接口页面
router.get('/detail/edit/*', (req, res) => {
    //文件名称其实就是url最后的参数
    var jsonName = './public/jsonfile/' + req.params[0] + '.json';
    if (!req.params[0]) {
        res.redirect('/')
    } else {
        var readPromise = new Promise((resolve, reject) => {
            resolve(fs.readFileSync(jsonName))
        });
        readPromise.then((response) => {
            res.render('create', {
                isEdit: true,
                stringValueJson: JSON.parse(response)
            })
        }).catch((response) => {
            res.render('noresult')
        })
    }
})

//删除接口
router.post("/devare", (req, res) => {
    var jsonUrl = req.body.url.replace(/\s/g, ""),
        jsonName = './public/jsonfile/' + jsonUrl + '.json',
        del = new Promise((resolve, reject) => {
            resolve(fs.unlinkSync(jsonName))
        });
    saveName(jsonName, jsonUrl, true)
    del.then((response) => {
        res.json({
            code: 0,
            success: true
        })
    }).catch((e) => {
        res.json({
            code: 1,
            success: false,
            info: e
        })
    })
})

//创建接口页面
router.get('/detail/create', (req, res) => {
    console.log(req.params)
    var project = req.params[0].split('/')[2]
    res.render('create', {
        isEdit: false,
        project: project
    })
})

module.exports = app;