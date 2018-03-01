import mobx,{ observable, action } from 'mobx'
import openSocket from 'socket.io-client'
import axios from 'axios'
const server_url = 'http://104.131.105.4:8080';
// const server_url = 'http://localhost:3001';
const socket = openSocket(server_url)
// import { getObjects, addObject, deleteObject } from 'cosmicjs'
// import config from '../config'

// setTimeout(function() {
//     observableTodoStore.addTodo('Random Todo ' + Math.random());
//     observableTodoStore.pendingRequests--;
// }, 2000);
mobx.useStrict(true)
export default class AppState {
  @observable total_scanned = 0
  @observable history_items = []

  @observable requesting_more_history = false;
  @observable requested_more_history = false;
  @observable bottomed_out = false;
  @observable current_article = {}
  @observable history_open = false
  @observable feed_open = true
  @observable scan_open = false
  @observable fullscreen = false
  @observable ticker_handle = false

  @action
  toggleSection(section) {
    this[section + "_open"] = ! this[section + "_open"];
  }

  @action
  toggleFullScreen() {
    console.log("Toggeling Fullscreen");
    console.log({togglethis:this});;
    this.props.data.fullscreen = ! this.props.data.fullscreen;
  }

  @action
  connect() {
    socket.on('count_update', this.updateCount);
    socket.on('current_article_update', this.updateArticle);
    socket.on('history', this.updateHistory);
    // socket.on('total_update', this.updateTotal);
  }
  //TEST
  // @action.bound // callback action
  // updateTotal(q) {
  //    console.log({m:m});
  // }
  //SCAN COUTN UPDATE
  @action.bound // callback action
  updateCount(num) {
    console.log({num:num});
     this.total_scanned = num;
  }
  //CURRENT ARTICLE
  @action.bound // callback action
  updateArticle(article) {
    article.progress = 0;
    var img = new Image();
    img.src = article.originalimage_source;
    img.onload = this.startAnimation;
    article.loaded_img = false;
    article.img = img;
    //animation track Math
    // var track = [];
    // const vpw = 18;//view port width
    // const vph = 10;//view port height
    // const ogw = article.originalimage_width;
    // const ogh = article.originalimage_height;
    // const x_steps = Math.floor(ogw/vpw) - 1;
    // const y_max = ogh - vph;
    // for (var i = x_steps; i > 0; i--) {
    //   var x = i * vpw;
    //   for (var j = y_max; j > 0; j--) {
    //     track.push([x,j]);
    //   }
    // }
    article.track_length = article.track.length;
    article.track = article.track;
    article.track_step = 0;
    console.log(article);
    this.current_article = article;
    //  this.total_scanned = num;
  }
  @action.bound // callback action
  startAnimation(img) {
    console.log({img:img});
    this.current_article.loaded_img = true;
    var that = this;
    // setInterval(, 1000);
    clearInterval(this.ticker_handle);
    this.ticker_handle = setInterval(this.stepTrack, 25);//75 is smooth

  }
  @action.bound
  stepTrack(){
    if(this.current_article.track_step < this.current_article.track_length - 50) this.current_article.track_step = this.current_article.track_step + 1;
    else this.current_article.track_step = 0;
  }


  //HISTORY UPDATE
  @action.bound // callback action
  updateHistory(articles) {
    console.log({articles:articles});
    console.log({history_items:this.history_items});
    if(this.requested_more_history){
      const that = this;
      articles = articles.filter(function (article) {
        for (var i = 0; i < that.history_items.length; i++) {
          console.log({old:that.history_items[i].id, new:article.id});
          if(that.history_items[i].id == article.id) return false;
        }
        return true;
      });
      this.history_items = [...articles,...this.history_items];
      console.log({articles:articles, history_items:this.history_items});

    }
    else this.history_items = articles;
  }
  //___REQUEST MORE HISTORY___
  @action
  requestMoreHistory(ev){
      const scroll_pos = {
        ev:ev,
        scrollTop : ev.path[0].scrollTop,
        scrollHeight : ev.path[0].scrollHeight,
        offsetHeight : ev.path[0].offsetHeight
      };
      console.log(scroll_pos);
      if(! this.props.data.requesting_more_history && scroll_pos.scrollTop === (scroll_pos.scrollHeight - scroll_pos.offsetHeight))
      {
        console.log("BOTTOMING OUT")

        console.log('requestMoreHistory()');
        this.props.data.requesting_more_history = true;
        this.props.data.requested_more_history = true;
        const oldest = this.props.data.history_items[this.props.data.history_items.length - 1];
        console.log({oldest:oldest});
        axios.post(server_url + '/more_history', {
          oldest:oldest
        }).then(this.props.data.requestMoreHistorySuccess,this.props.data.requestMoreHistorySuccess)

      }
  }
  @action.bound // callback action
  requestMoreHistorySuccess(r) {
    console.log({requestMoreHistorySuccess:this});
    console.log({more_history:r.data});
    // if(typeof r.data == 'undefined') this.bottomed_out = true;
    if(r.data == null || r.data.length < 10) this.bottomed_out = true;
    for (var i in r.data) {
      this.history_items = [...this.history_items, r.data[i]];
    }
    this.requesting_more_history = false;
  }


  //___END REQUEST MORE HISTORY___
  // .then(function (response) {
  //   console.log(response);
  //   that.requesting_more_history = false;
  // })
  // .catch(function (error) {
  //   console.log(error);
  // });

  // @action.bound // callback action
  // fetchProjectsError(error) {
  //    this.state = "error"
  // }

  // addPost(object) {
  //   this.is_saving = true;
  //   addObject({ bucket: config.cosmicjs.bucket }, object, (err, res) => {
  //     this.is_saving = false
  //     this.posts.unshift(res.object)
  //     this.form_data = {
  //       title: '',
  //       content: ''
  //     }
  //   })
  // }
  // removePost(post) {
  //   deleteObject({ bucket: config.cosmicjs.bucket }, { slug: post.slug }, (err, res) => {
  //     this.posts = this.posts.filter(apost => {
  //       return apost._id !== post._id
  //     })
  //   })
  // }
  constructor() {
    // socket.on('history', function(history){
    //   this.history_items = history;
    // });
    this.connect();

    // getObjects({ bucket: config.cosmicjs.bucket }, (err, res) => {
    //   if (res.objects.type.posts) {
    //     this.posts = res.objects.type.posts
    //     this.is_loading = false
    //   }
    // })
  }
}
