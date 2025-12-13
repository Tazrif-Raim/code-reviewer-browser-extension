export default defineContentScript({
  matches: ['*://*.github.com/*'],
  main() {
    console.log('Hello content.');
  },
});
