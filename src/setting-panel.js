let fs = require('fs')
let path = require('path')
let packageCfg = require('../package.json')
Editor.Panel.define = Editor.Panel.define || ((args)=>{return args})


function saveConfig(doms){
    Editor.Profile.setConfig(packageCfg.name,'zipRate',doms.zipRateSlider.value);
    Editor.Profile.setConfig(packageCfg.name,'zipMode',doms.zipModeTab.value);
}

module.exports = Editor.Panel.define({
    template: fs.readFileSync(path.join(__dirname, '../template/setting.html'), 'utf-8'),
    style: fs.readFileSync(path.join(__dirname, '../template/setting.css'), 'utf-8'),

    $: {
        zipRateSlider: '#zipRateSlider',
        saveBtn: '#saveBtn',
        zipModeTab: '#zipModeTab',
    },

    async ready() {
        this.$.zipRateSlider.value = parseInt(await Editor.Profile.getConfig(packageCfg.name,'zipRate')) || 30;
        this.$.zipModeTab.value = parseInt(await Editor.Profile.getConfig(packageCfg.name,'zipMode')) || 0;
        this.$.zipModeTab.addEventListener('click',()=>{
            this.$.zipModeTab.value == 1 ? this.$.zipRateSlider.disabled = true : this.$.zipRateSlider.removeAttribute('disabled');
            saveConfig(this.$);
        },0)

        this.$.saveBtn.addEventListener('click',()=>{
            saveConfig(this.$);
        },0)
    },


    listeners: {
    },
    methods: {
    },
    beforeClose() { },
    close() { 
        saveConfig(this.$);
    },
});
