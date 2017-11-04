class Cookies {
  public get(name: string): string {
    const cookies = document.cookie.split(';')

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      
      const [cookieName, cookieValue] = cookie.split('=')

      if (cookieName.trim() === name) {
        return cookieValue.trim()
      }
    }
  }

  public add(name: string, value: string, days: number) {
    let expires = ''

    if (days) {
      const date = new Date()
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
      expires = "; expires=" + date.toUTCString();
    }

    document.cookie = `${name}=${value}; expires=${expires}; path=/`
  }

  public delete(name: string) {
    this.add(name, '', -1)
  }
}

export default new Cookies()