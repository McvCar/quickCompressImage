let fs = require('fs')
let path = require('path')
let packageCfg = require('../package.json')
Editor.Panel.define = Editor.Panel.define || ((args)=>{return args})


module.exports = Editor.Panel.define({
    template: fs.readFileSync(path.join(__dirname, '../template/setting.html'), 'utf-8'),
    style: fs.readFileSync(path.join(__dirname, '../template/setting.css'), 'utf-8'),

    $: {
        zipRateSlider: '#zipRateSlider',
        saveBtn: '#saveBtn',
    },

    async ready() {

        this.$.zipRateSlider.value = parseInt(await Editor.Profile.getConfig(packageCfg.name,'zipRate')) || 30;
        this.$.saveBtn.addEventListener('click',()=>{
            this.saveConfig();
        },0)
    },

    saveConfig(){
        Editor.Profile.setConfig(packageCfg.name,'zipRate',this.$.zipRateSlider.value);
    },

    listeners: {
    },
    methods: {
    },
    beforeClose() { },
    close() { 
        this.saveConfig();
    },
});
