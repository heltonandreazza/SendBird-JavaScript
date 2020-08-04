export default (function () {
  let instance

  function AppStateChangeHandler() {
    this.cbs = {}
    this.addCallback = (key, cb) => {
      this.cbs[key] = cb
      return () => {
        delete this.cbs[key]
      }
    }

    this.notify = () => {
      for (const key in this.cbs) {
        this.cbs[key]()
      }
    }
  }

  return {
    getInstance() {
      if (!instance) {
        instance = new AppStateChangeHandler()
      }
      return instance
    },
  }
}())
