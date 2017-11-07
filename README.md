# Shifu Biscuit

## Dependencies

Tested with node  `v8.9.0` and npm `v5.5.1`

## Usage

Install the dependencies first
```
npm install
```

Start the development server on localhost port `8080`
```
npm start
```
Format the code base using [Prettier](https://prettier.io/)
It outputs the new files by default, so make sure to commit your work first
```
npm run format
```
Build the project and output the generated files in `./dist`
```
npm run build
```
Delete `./dist`
```
$ npm run clean
```

## Deployment

- Using [Surge](http://surge.sh/)
	- Install surge
	-  ```npm run clean```
	-  ```npm run build```
	-  ```cd ./dist```
	-  ```surge```
	- Follow the instructions

- Using [Github pages](https://pages.github.com/) (where  [shifu-biscuit.tw](http://www.shifu-biscuit.tw/) is currently pointing)

	-  ```npm run clean```
	-  ```npm run build```
	-  Copy the content of `./dist` to a temporary folder
	-  Delete `./dist/data.json` not to override the one in `gh-pages` (or update it in `master`)
	-  ```git checkout --orphan gh-pages```
	-  Delete everything and put the content of `./dist` previously saved
	-  ```git push origin gh-pages```
