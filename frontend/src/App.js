import React, { Component } from 'react';
import { observer } from 'mobx-react';
import logo from './logo.svg';
import './App.css';
import classNames from 'classnames';


@observer
class App extends Component {

  handleSectionClick(section) {
    this.props.data.toggleSection(section)
  }
  render() {
    const data = this.props.data;

    return (
      <div className="wrapper">
        <div className="App">
          <div className="punch_line">
            <div><p>Looking for meaning in</p><input type="text" value={ data.current_article.title } /></div>
            <p>searched { data.total_scanned } images of 40.3M</p>
          </div>
          <div className="app_body">
            <div className="history">
              <div className={classNames('panel', {'open': data.history_open})}>
                <p className='title'>Did not find meaning in:</p>
                <History articles={data.history_items} showSpinner={! data.bottomed_out} handleScroll={data.requestMoreHistory.bind(this)}/>
              </div>
            </div>
            <div className={classNames('history_toggle', {'open': !data.history_open})}>
              <a onClick={ this.handleSectionClick.bind(this, 'history') }><p>.history</p></a>
            </div>
            <div className="feed">
              <div className={classNames('panel', {'open': data.feed_open})}>
                <FeedCanvas fullscreen={data.fullscreen} handleFullScreen={data.toggleFullScreen.bind(this)} article={data.current_article}/>
              </div>
            </div>
            <div className={classNames('feed_toggle', {'open': !data.feed_open},{'temp_hide': data.fullscreen})}>
              <a onClick={ this.handleSectionClick.bind(this, 'feed') }><p>.feed</p></a>
            </div>
            <div className="scan">
              <div className={classNames('panel', {'open': data.scan_open})}>
                <ScanCanvas article={data.current_article} />
              </div>
            </div>
            <div className={classNames('scan_toggle', {'open': !data.scan_open}, {'temp_hide': data.fullscreen})}>
              <a onClick={ this.handleSectionClick.bind(this, 'scan') }><p>.scan</p></a>
            </div>
          </div>
        </div>
      </div>

    );
  }
}

@observer
class ScanCanvas extends Component {
    componentDidMount() {
        //this.updateCanvas();
        //console.log({CanvasComponent_this:this});
    }
    updateCanvas() {
        //const ctx = this.refs.canvas.getContext('2d');
        //ctx.fillRect(0,0, 100, 100);
    }
    render() {
      if(this.props.article.loaded_img){
        const ctx = this.refs.scan_canvas.getContext('2d');
        var img = this.props.article.img;
        ctx.drawImage(img, 0, 0, 300, (300/this.props.article.originalimage_width) * this.props.article.originalimage_height );
        img.style.display = 'none';
        ctx.strokeStyle = 'red';
        const scale_factor = 300/this.props.article.originalimage_width;
        ctx.strokeRect(
          Math.floor(scale_factor * this.props.article.track[this.props.article.track_step][0]),
          Math.floor(scale_factor * this.props.article.track[this.props.article.track_step][1]),
          Math.floor(scale_factor * 18),
          Math.floor(scale_factor * 10)
        );
      }
      return (
        <div className="canvas_warpper">
          <canvas ref="scan_canvas" width='300' height={(300/this.props.article.originalimage_width) * this.props.article.originalimage_height }  />
        </div>
      );
    }
}

@observer
class FeedCanvas extends Component {
    componentDidMount() {
        this.updateCanvas();
        console.log({CanvasComponent_this:this});
    }
    updateCanvas() {
        const ctx = this.refs.canvas.getContext('2d');
        /*ctx.fillRect(0,0, 100, 100);*/
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
    }

    render() {
      if(this.props.article.loaded_img){
        const ctx = this.refs.canvas.getContext('2d');
        var img = this.props.article.img;
        ctx.drawImage(img, this.props.article.track[this.props.article.track_step][0], this.props.article.track[this.props.article.track_step][1], 18,10,0,0,424,238);
        img.style.display = 'none';
      }

      return (
        <div className={classNames('canvas_warpper', {'fullscreen': this.props.fullscreen})}>
          <a onClick={ this.props.handleFullScreen } className='fullscreen_btn'>
            {!this.props.fullscreen ? <i class="fa fa-expand" aria-hidden="true"></i> : <i class="fa fa-compress" aria-hidden="true"></i>}
            </a>
          <canvas ref="canvas" />
        </div>
      );
    }
}
class History extends Component {
  _handleScroll(ev) {
      const scroll_pos = {
        ev:ev,
        scrollTop : ev.path[0].scrollTop,
        scrollHeight : ev.path[0].scrollHeight,
        offsetHeight : ev.path[0].offsetHeight
      };
      console.log(scroll_pos );
      if( scroll_pos.scrollTop === (scroll_pos.scrollHeight - scroll_pos.offsetHeight))
      {
        console.log("BOTTOMING OUT")
        /*console.log({f:this});*/
        console.log({_handleScroll_this:this})
        /*this.props.handleScroll()*/
      }
  }
  componentDidMount() {
      this.refs.history.addEventListener('scroll', this.props.handleScroll);
  }
  componentWillUnmount() {
      this.refs.history.removeEventListener('scroll', this.props.handleScroll);
  }
  render() {
    const articles = this.props.articles;
    const listItems = articles.map((article) =>
      <li>
      <p>-{article.title}</p>
      <div className='img_wrap'><img src={ article.thumb ? article.thumb : '' } /></div>
      </li>
    );
    return (
      <div className="scroll_wrap">
        <ul ref="history">{listItems}<div className='spinner'>{this.props.showSpinner ? <i className="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i> : ''}</div></ul>

      </div>
    );
  }
}


export default App;
