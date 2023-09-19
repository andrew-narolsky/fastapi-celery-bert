class ContentParser {

    API_URL = '/tasks'
    fileLoader = document.querySelector('.file-loader')
    fileLoaderWrap = document.querySelector('.file-loader-wrap')
    uploadButton = document.querySelector('#upload')

    fileGenerator = document.querySelector('.file-generator')
    sendForm = document.querySelector('#start_generator')
    sendButton = document.querySelector('#start_generator button')

    InitEvents() {
        this.uploadButton.addEventListener('change', this.UploadFile.bind(this))
        this.sendForm.addEventListener('submit', this.Start.bind(this))
    }

    constructor() {
        this.InitEvents()
    }

    ValidateEmail(email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }


    Start(event) {
        event.preventDefault()
        let input = event.target.querySelector('input')
        input.classList.remove('is-invalid')

        let email = input.value
        if (!email || !this.ValidateEmail(email)) {
            input.classList.add('is-invalid')
            return false
        }

        let myHeaders = new Headers()
        myHeaders.append('Content-Type', 'application/json')

        let raw = JSON.stringify({
            'query': window.loadded_data,
            'email': email
        })

        let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        }

        this.sendButton.disabled = true

        fetch(this.API_URL, requestOptions)
            .then(response => response.text())
            .then(result => {
                let data = JSON.parse(result)
                if (data.status === 200) {
                    setTimeout(() => {
                        Swal.fire(
                          'Task started!',
                          'After completing you will receive an email with the results',
                          'success'
                        )
                        this.fileGenerator.classList.add('hidden')
                    }, 1000)
                }
            })
            .catch(error => console.log('error', error))
    }

    UploadFile(event) {

        event.target.setAttribute('disabled', 'disabled')
        this.fileLoaderWrap.classList.add('disabled')

        let result = []
        const file = event.target.files[0]
        const workbook = new ExcelJS.Workbook()

        workbook.xlsx.load(file).then(() => {
            let worksheet = workbook.getWorksheet('Sheet1')
            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                if (rowNumber > 1) {
                    console.log(row)
                    result[rowNumber] = {
                        'url': row.values[1].text ?? row.values[1],
                        'query': row.values[2].text ?? row.values[2],
                    }
                }
            })

            window.loadded_data = result.filter(function (el) {
              return el != null;
            })

            setTimeout(() => {
                Swal.fire('File loaded!')
                this.fileLoader.classList.add('hidden')
                this.fileGenerator.classList.remove('hidden')
            }, 1000)
        })
    }
}

(function () {
    window.loadded_data = {}
    new ContentParser()
})()