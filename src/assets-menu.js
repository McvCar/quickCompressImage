let Path = require('path')
let Fs = require('fs');
let imageminApi = require('../lib/imagemin.min')
let packageCfg = require('../package.json')
// const imageminMozjpeg = require('imagemin-mozjpeg');
// assets-menu.js
let AssetsMenu = {
	onCreateMenu(assetInfo) {
		return [
			{
				label: 'i18n:quick-compress-image.menu.createAsset',
				click() {
					if (!assetInfo) {
						console.log('get create command from header menu');
					} else {
						console.log('get create command, the detail of diretory asset is:');
						console.log(assetInfo);
					}
				},
			},
		];
	},

	onAssetMenu(assetInfo) {
		return assetInfo.importer == 'image' ? [
			{
				label: 'i18n:quick-compress-image.compressPicture',
				enabled: true,
				click() {
					console.log('yes, you clicked');
					console.log(assetInfo);
					AssetsMenu.onStartCompressPicture(assetInfo)
				},
				// submenu: [
				// 	{
				// 		label: 'i18n:quick-compress-image.menu.assetCommand1',
				// 		enabled: assetInfo.isDirectory,
				// 		click() {
				// 			console.log('get it');
				// 			console.log(assetInfo);
				// 		},
				// 	},
				// ],
			},
		] : [];
	},

	isImageFile(filePath){
		let extname = Path.extname(filePath).toLocaleLowerCase()
		if(extname == '.png' || extname == '.jpg'){
			return true;
		}
		return false;
	},

	getFileSize(fsPath){
		try {
			return Fs.statSync(fsPath).size
		} catch (error) {
			return -1
		}
	},

	/**
	 * 返回选中的图片
	 * @param {*} assetInfo 
	 * @returns {Promise<Array<{file:string,uuid:string,size:number}>>}
	 */
	async getImageFileList(assetInfo){
		let fileUuidList = Editor.Selection.getSelected('asset');
		let imageFileList = [];

		if(fileUuidList.includes(assetInfo.uuid)){
			for (let i = 0; i < fileUuidList.length; i++) {
				const uuid = fileUuidList[i];
				const fsPath = await Editor.Message.request("asset-db",'query-path',uuid);

				if(fsPath && this.isImageFile(fsPath)){
					imageFileList.push({
						file: fsPath,
						uuid: uuid,
						size: this.getFileSize(fsPath)
					})
				}
			}
		}else{
			if(assetInfo.file && this.isImageFile(assetInfo.file)){
				imageFileList.push({
					file: assetInfo.file,
					uuid: assetInfo.uuid,
				})
			}
		}
		return imageFileList;
	},

	async onStartCompressPicture(assetInfo){
		let imageFileList = await this.getImageFileList(assetInfo);
		let arrList = [];
		for (let i = 0; i < imageFileList.length; i++) {
			const fileInfo = imageFileList[i];
			arrList.push(fileInfo.file);
		}
		this.onCompressPicture(arrList,imageFileList);
	},

	async getZipRate(){
		let rate = parseInt(await Editor.Profile.getConfig(packageCfg.name,'zipRate')) || 30;
		if(rate<0){
			rate = 1;
		}else if(rate>100){
			rate = 100
		}
		return rate;
	},

	/**
	 * 
	 * @param {Array<{file:string,uuid:string}>} fileInfo 
	 */
	 async onCompressPicture(arrList,imageFileList){
		let rate = await this.getZipRate();
		let pngRate = rate*0.01;
		console.log("正在压缩图片...,压缩值:",rate+"%");
        imageminApi.imagemin(arrList, {
            // destination: resPath,
            plugins: [
                imageminApi.imageminMozjpeg({
                    quality: rate  //压缩质量（0,1）
                }),
                imageminApi.imageminPngquant({
                    quality: [pngRate, Math.min(pngRate+0.25,1)]  //压缩质量（0,1）
                })
            ]
        }).then((arrRes) => {
            console.log("压缩成功,详情:\n")
			for (let i = 0; i < arrRes.length; i++) {
				const res = arrRes[i];
				this.onCompressedSucceed(imageFileList,res)
			}
        }
        ).catch(err => {
            console.log("压缩失败:",err)
        });
	},
	
	/**
	 * 压缩成功
	 * @param {Array<{file:string,uuid:string,size:number}>} imageFileList 
	 * @param {Object<{data:Buffer,sourcePath:string}>} res 
	 */
	onCompressedSucceed(imageFileList,res){

		let desc = ""
		for (let i = 0; i < imageFileList.length; i++) {
			const fileInfo = imageFileList[i];
			if(fileInfo.file.replace(/\\/g,'/') == res.sourcePath){
				const fileName = Path.basename(fileInfo.file);
				const newSize = res.data.byteLength;
				const rate = (fileInfo.size-newSize)/fileInfo.size;
				const oldMb = (fileInfo.size / 1024).toFixed(1) + " KB";
				const newMb = (newSize / 1024).toFixed(1) + " KB";
				if(newSize < fileInfo.size){
					Fs.writeFileSync(res.sourcePath, res.data)
					desc += `${fileName}、压缩率:${parseInt(rate*100)}%、压缩前后大小:${newMb} / ${oldMb}`
				}else{
					desc += `${fileName}、无法继续压缩`
				}
				break;
			}
		}
		console.log(desc);
	},
}

module.exports = AssetsMenu;

