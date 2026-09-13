/* Behaviour specific to direction E: the review ledger keeps working while you read it. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var box=document.querySelector('[data-ledger]');
  if(!box) return;
  var queue=JSON.parse(box.getAttribute('data-ledger'));
  var list=box.querySelector('.lbody');
  var rows=[].slice.call(list.querySelectorAll('.lrow'));
  var at=rows.length;

  function paint(row,item){
    row.querySelector('.id').innerHTML='<b>'+item[0]+'</b>'+item[1];
    var v=row.querySelector('.vd');
    v.className='vd '+(item[2]==='pass'?'pass':'stop');
    v.textContent=item[2]==='pass'?'Pass':'Declined';
  }
  rows.forEach(function(r,i){ paint(r,queue[i]); });
  if(reduce) return;

  setInterval(function(){
    rows[0].classList.add('out');
    setTimeout(function(){
      var first=rows.shift();
      first.classList.remove('out','fresh');
      list.appendChild(first);
      rows.push(first);
      paint(first,queue[at % queue.length]); at++;
      /* force the stamp animation to replay on the row that just arrived */
      void first.offsetWidth; first.classList.add('fresh');
    },330);
  },2900);
})();
