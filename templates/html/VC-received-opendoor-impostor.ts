const VCReceivedOpenDoorImpostor = `<!DOCTYPE html>
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
         body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
               'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
               sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
         }
      </style>
      <title>KayTrust</title>
      <script> 
         setTimeout("window.close()",15000);
      </script>
   </head>
<body style="background-color: #4747c1;">
    <div style="color: white; font-size: 3.5rem; font-weight: 800; text-align: center; padding: 10rem 5rem;">
    Hello, Impostor</br>
    We have received your sovereign digital identity and you are not NTT DATA Employee. </br>
    The doors will not open!</br>
   </div>
   <div style="text-align: center; padding: 2rem;">
      <span 
         style="background-color: #8326BB; color: white; padding: 1rem; outline: none; border: none; font-size: 1.5rem;
                font-weight: 700; padding: 2rem; cursor: pointer; box-shadow: 0px 14px 35px -12px rgba(0,0,0,0.46);
                -webkit-box-shadow: 0px 14px 35px -12px rgba(0,0,0,0.46); -moz-box-shadow: 0px 14px 35px -12px rgba(0,0,0,0.46);">
         {subject_did}
      </span>
   </div>
   <div style="color: white; font-size: 1.5rem; font-weight: 700; text-align: center; padding: 5rem;">
   Bye, bye, Impostor.
   </div>

</body>
</html>`

export default VCReceivedOpenDoorImpostor;