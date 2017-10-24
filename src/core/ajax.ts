export function GET(url: string, callback: (response: string) => any) {
  const request = new XMLHttpRequest()

  request.onload = () => {
    if (request.status === 200) {
      callback(request.responseText)
    } else {
      callback(null)
    }
  }

  request.open('GET', url, true)
  request.send(null)
}
