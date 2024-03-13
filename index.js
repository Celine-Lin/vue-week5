
const apiUrl = 'https://vue3-course-api.hexschool.io/v2';
const apiPath = 'vue-week2-new';

// Modal 元件
const userModal = {
    // props: ['tempProduct'], // 將外層資料傳入
    data() {
        return {
            productModal: null, // 建立 modal
        }
    },
    template: '#userProductModal', // x-template 封裝模板
    mounted() {
        // 使用 ref 定位
        this.productModal = new bootstrap.Modal(this.$refs.modal);
        this.productModal.show();
    },
};

const app = Vue.createApp({
    data() {
        return {
            products: [],
            tempProduct: {},
        }
    },
    methods: {
        getProducts(){
            axios
            .get(`${apiUrl}/api/${apiPath}/products`)
            .then(res=>{
                this.products = res.data.products;
            })
            .catch(err=>{
                console.log(err);
            })
        },
        openModal(product){
            this.tempProduct = product;
            // this.$refs.userModal.open();
        }
    },
    components: {
        userModal,
    },
    mounted() {
        this.getProducts();
    }
});

app.mount('#app');





    
