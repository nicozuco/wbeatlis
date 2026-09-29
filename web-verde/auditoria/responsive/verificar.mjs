// Optional QA tooling; the website itself has no runtime dependencies.
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const baseURL = process.env.ATLIS_QA_URL || 'http://127.0.0.1:4317';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const results=[];
for (const [name,engine] of [['Chrome',chromium],['WebKit',webkit]]) {
 const browser=await engine.launch(name==='Chrome'?{channel:'chrome',headless:true}:{headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+':'+r.status())});
 const fit=async(label)=>{
  const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(metrics.scroll<=metrics.client+1,`${name} ${label}: horizontal overflow ${JSON.stringify(metrics)}`);
  assert.ok(metrics.inner<=metrics.client+1,`${name} ${label}: viewport shrinking ${JSON.stringify(metrics)}`);
 };
 const widths=[320,360,375,390,430,600,700,768,800,820,1000,1024,1440];
 for(const path of ['/','/demo.html','/privacidad.html','/aviso-legal.html']){
  await page.goto(baseURL+path);await page.evaluate(()=>document.fonts.ready);
  for(const width of widths){await page.setViewportSize({width,height:844});await fit(path+' '+width);}
 }
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.goto(baseURL);
  await page.locator('.menu-toggle').tap();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
  await fit('menu '+width);await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  await page.locator('.menu-toggle').tap();await page.locator('#mobile-nav a[href="#impacto"]').tap();assert.equal(await page.locator('#mobile-nav').isVisible(),false);
  assert.ok(await page.locator('#impacto').evaluate(e=>e.getBoundingClientRect().top)>=74,'Anchor concealed by header');
  await page.locator('[data-channel-tab="web"]').tap();assert.equal(await page.locator('#channel-panel').getAttribute('data-channel'),'web');
  await page.locator('[data-channel-tab="whatsapp"]').tap();
  await page.locator('.gcal-event').tap();assert.ok(await page.locator('#calendar-event-details').isVisible());await fit('calendar');await page.locator('.gcal-event').tap();
  const solutions=[['appointment','hours'],['reply','stop'],['confirm','change'],['review','approve']];
  for(let i=0;i<4;i++){
   await page.locator(`[data-solution="${i}"]`).tap();await fit('solution '+i);
   for(const action of solutions[i]){
    await page.locator(`[data-solution-action="${action}"]`).tap();await fit('solution action '+action);
    const over=await page.locator('.solution-scene').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(over,false,'Solution content clips');
    if(i!==3)await page.locator('[data-solution-action="reset"]').tap();
   }
  }
  for(const id of ['after-hours','reschedule','human']){
   await page.locator(`[data-scenario="${id}"]`).tap();
   for(let step=0;step<3;step++){
    await page.locator('[data-case-action]').first().tap();await fit(id+' phase '+step);
    assert.equal(await page.locator('.scenario-content').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'Scenario clips');
   }
   assert.ok(await page.locator('.case-contact').isVisible());
   await page.locator('[data-case-scroll]').tap();assert.ok(await page.locator('.scenario-outcome').evaluate(e=>e.getBoundingClientRect().top)>=74,'Outcome concealed');
   await page.locator('.scenario-reset').tap();assert.ok(await page.locator('[data-case-action="respond"]').isVisible());
  }
  await page.locator('#appointments').fill('100');await page.locator('#appointments').blur();assert.equal(await page.locator('#result-monthly').textContent(),'6000');
  await page.locator('#treatment').fill('15000');await page.locator('#treatment').blur();await fit('calculator max');
  for(const selector of ['.impact-number input','.impact-slider','.menu-toggle','.channel-tab','.scene-action','.case-action']){
   for(const node of await page.locator(selector).all())if(await node.isVisible())assert.ok((await node.boundingBox()).height>=44,selector+' touch height');
  }
  for(const input of await page.locator('.impact-number input').all())assert.ok(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=16,'Input would trigger iOS zoom');
  for(const summary of await page.locator('.faq-thread summary').all()){await summary.tap();await fit('FAQ');}
  await page.locator('.impact-formula summary').tap();await fit('formula');
  await page.goto(baseURL+'/demo.html');assert.ok(await page.locator('#form-calc-note').isVisible());
  for(const input of await page.locator('.form-field input,.form-field select').all())assert.ok(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=16,'Form would trigger iOS zoom');
  await page.locator('.submit-button').tap();assert.equal(await page.locator('#name').getAttribute('aria-invalid'),'true');
  await page.locator('#name').fill('Prueba responsive');await page.locator('#email').fill('qa@example.invalid');await page.locator('#clinic').fill('Clínica de prueba');
  await page.locator('.submit-button').tap();assert.match(await page.locator('#form-status').textContent(),/No se ha enviado ningún dato/);
  await fit('form validation');await context.clearCookies();await page.evaluate(()=>sessionStorage.clear());
 }
 await page.setViewportSize({width:844,height:390});await page.goto(baseURL);await page.locator('.menu-toggle').tap();
 const nav=page.locator('#mobile-nav');assert.ok(await nav.evaluate(e=>e.getBoundingClientRect().bottom)<=390,'Landscape menu beyond viewport');
 await nav.locator('a').last().scrollIntoViewIfNeeded();assert.ok(await nav.locator('a').last().isVisible());
 await page.setViewportSize({width:1100,height:800});await nav.waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);results.push({engine:name,pages:4,widths,interactionWidths:[320,390,768],landscape:'844 × 390',status:'passed',errors});
 await browser.close();console.log(name+' passed');
}
await writeFile(new URL('./resultados.json', import.meta.url),JSON.stringify(results,null,2));
