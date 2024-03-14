const apiUrl = 'https://vue3-course-api.hexschool.io/v2';
const apiPath = 'vue-week2-new';

// VeeValidate 定義規則：全部加入(CDN 版本)
Object.keys(VeeValidateRules).forEach(rule => {
    if (rule !== 'default') {
        VeeValidate.defineRule(rule, VeeValidateRules[rule]);
    }
});
// 加入多國語系：讀取外部的資源
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');

// 加入多國語系：Activate the locale
VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize('zh_TW'), // 切換成中文版警示
  validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});

// SweetAlert2
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 1500,
    onOpen: toast => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});


// Modal 元件
const userModal = {
    props: ['tempProductInner','addCart'], // 將外層資料傳入
    data() {
        return {
            productModal: null, // 建立 modal
            qty: 1, // addCart的數量變數
        }
    },
    template: '#userProductModal', // x-template 封裝模板
    methods:{
        open(){
            this.productModal.show();
        },
        close(){
            this.productModal.hide();
        }
    },
    watch:{
        tempProductInner(){
            this.qty = 1 ;
        }
    },
    mounted() {
        // 使用 ref 定位
        this.productModal = new bootstrap.Modal(this.$refs.modal);
    },
};

const app = Vue.createApp({
    data() {
        return {
            isLoading: true,
            products: [],
            tempProductOuter: {},
            carts: [],
            status: {
                addCartLoading: '',
                changeCartQtyLoading: '',
                removeCartItemLoading: '',
            },
            // VeeValidate
            form: {
                user: {
                    name: '',
                    email: '',
                    tel: '',
                    address: '',
                },
                message: ''
            },
        }
    },
    methods: {
        getProducts(){
            setTimeout(() => {
                axios
                .get(`${apiUrl}/api/${apiPath}/products`)
                .then(res=>{
                    this.isLoading = false;
                    this.products = res.data.products;
                })
                .catch(err=>{
                    Toast.fire({
                        icon: 'error',
                        title: '很抱歉，目前無法載入資料。'
                    });
                })
            },1000);
        },
        openModal(product){
            this.tempProductOuter = product;
            this.$refs.userModalRef.open();
        },
        addCart(product_id, qty=1){ // 參數預設值
            // 點擊加入購物車，會有讀取效果（區域 Loading)
            this.status.addCartLoading = product_id;

            const order = {
                product_id,
                qty
            };

            axios
            .post(`${apiUrl}/api/${apiPath}/cart`, {data: order})
            .then(res=>{
                Toast.fire({
                    icon: 'success',
                    title: '成功加入購物車！'
                  });
                // 成功加入購物車後，清除 loading 的 product id
                this.status.addCartLoading = '';
                // 關閉 modal
                this.$refs.userModalRef.close();
                // 每次加入購物車，都會更新購物車資料
                this.getCarts();
            })
            .catch(err=>{
                Toast.fire({
                    icon: 'error',
                    title: '加入購物車失敗，請重新操作。'
                });
            })
        },
        changeCartQty(item, qty=1){ // 參數預設值
            const order = {
                product_id: item.product_id,
                qty
            };

            this.status.changeCartQtyLoading = item.id;

            axios
            .put(`${apiUrl}/api/${apiPath}/cart/${item.id}`, {data: order})
            .then(res=>{
                this.status.changeCartQtyLoading = '';
                this.getCarts();
            })
            .catch(err=>{
                Toast.fire({
                    icon: 'error',
                    title: '請重新操作。'
                });
            })
        },
        removeCartItem(id){
            this.status.removeCartItemLoading = id;

            axios
            .delete(`${apiUrl}/api/${apiPath}/cart/${id}`)
            .then(res=>{
                this.status.removeCartItemLoading = '';
                this.getCarts();
            })
            .catch(err=>{
                console.log(err);
            })
        },
        removeCart(){
            Swal.fire({
                title: "確定要清除購物車所有內容？",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                cancelButtonText: '取消',
                confirmButtonText: "刪除"
              })
              .then((result) => {
                if (result.isConfirmed) {
                    axios
                    .delete(`${apiUrl}/api/${apiPath}/carts`)
                    .then(res=>{
                        Swal.fire({
                            title: "成功清除購物車！",
                            icon: "success",
                            timer: 1500,
                        });
                        this.getCarts();
                    })
                    .catch(err=>{
                        Toast.fire({
                            icon: 'error',
                            title: '清除失敗，請重新操作。'
                        });
                    });
                }
              });
        },
        getCarts(){
            axios
            .get(`${apiUrl}/api/${apiPath}/cart`)
            .then(res=>{
                this.carts = res.data.data;
            })
            .catch(err=>{
                Toast.fire({
                    icon: 'error',
                    title: '很抱歉，目前無法讀取購物車內容。'
                });
            })
        },
        // 以下皆為 VeeValidate
        isName(value){
            if(value.length === 0) return '姓名 為必填欄位';

            const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/g;
            if(!nameRegex.test(value)) return '姓名 不能包含特殊字元';

            // 最後必須為 return 開頭的寫法，不然會有問題
            return !(value.length < 3 ) || '姓名 不能小於3個字'; 
        },
        isPhone(value) {
            if (value.length === 0) return '電話 為必填欄位';
            const phoneNumber = /^(09)[0-9]{8}$/;
            return phoneNumber.test(value) || '需要填寫正確的台灣手機號碼';
        },
        onSubmit() {
            if(this.carts.carts.length === 0) 
            return Swal.fire({
                title: "請先加入商品到購物車！",
                icon: "warning"
            });
            axios
            .post(`${apiUrl}/api/${apiPath}/order`, {data: this.form})
            .then(res=>{
                this.$refs.form.resetForm();
                this.getCarts();
                Swal.fire({
                    title: "訂單送出成功！",
                    icon: "success",
                });
            })
            .catch(err=>{
                Swal.fire({
                    title: "訂單送出失敗，請重新操作。",
                    icon: "error",
                });
            })
        },
    },
    components: {
        userModal,
    },
    mounted() {
        this.getProducts();
        this.getCarts();
    }
});

app.component('loading', VueLoading.Component);

app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);

app.mount('#app');





    
