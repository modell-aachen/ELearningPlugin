
/**
 * Q.Wiki-Tour - jQuery plugin to create an easy virtual tour across any website, but optimized for Q.Wiki.  
 * Copyright (c) 2015, Thiemo Leonhardt  
 *
 * Licensed under MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this 
 * software and associated documentation files (the "Software"), to deal in the Software 
 * without restriction, including without limitation the rights to use, copy, modify, merge, 
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
 * to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or 
 * substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @requires jQuery v1.2 or above
 * @version 1.0
 * @cat Plugins/UI
 * @author Thiemo Leonhardt (leonhardt@cs.rwth-aachen.de | )
 * @see
 * 
 * Based on My-Tour by Rogério Taques and PageGuide by Tracelytics, AppNeta
 */

/**
 * CHANGELOG
 * 
 * Optional: change step at the step-number
 * 
 * -> ToDo 1.1 validation of user input (hat to be clicked or had to be filled)
 * 1.0 change to uniform names and regEx for the tourfile no javascript possible
 * 0.9 Add cookie control of different tours
 * 0.8 Get the standard jqtabpane elements of the webapp automatic and css adjustments
 * 0.7 Add possibility to interact with elements
 * 0.6 Add support of JQueryPlugin panel elements 
 * 0.5 Add support of enjoyhint
 * 0.4 Fix CSS Bugs and add showing toursteps
 * 0.3 Two-Style-Support 
 * 0.2 PageGuide Style Support and CSS adjustments
 * 0.1 First merge.
 * 
 */
 
 
(function($){
	
    "use strict";
    
	var version = '1.0.0',
	
		stepContainer = [],
		stepCurrent = 0,
		stepShow = 0,					// counter to display the steps
		stepDummy = false,				// dummy to get the direction
		stepLastElement = false,		// dummy last element is Tip-Pos != down
		tourTrigger = null,
		
		defaults = {
			
			start: 0,					// indicate which step will start tour
			
			buttons: { 					// buttons:
				next: 'Next',			// next step. 
				prev: 'Prev',			// previous step.
				start: 'Start',			// backward to the first set step.
				finish: 'Finish',		// stop presentation.
				menu: true				// show/ hide the dropdown menu with the steps
			},
			
			autoStart: false,			// (true/ false) if true, start the tour automaticaly 
			autoPlay: false, 			// (true/ false) if true, the tour goes automaticaly 
			timer: 5000, 				// time elipsed before goes to the next step (if null, then don't goes)
			
			steps: '#my-tour-steps', 	// which objects will contain the steps that will be displayed for the user.
			stepHolder: 'li',			// which tag is used to hold the step content
			
			onStart: null,				// callback method, called when my-tour is started
			onShow: null,				// callback method, called when my-tour is played for the 1st time
			beforePlay: null,			// callback method, called always before play any step
			afterPlay: null,			// callback method, called always after has played any step
			onFinish: null,				// callback method, called when my-tour is finished
			
			debug: true				// (true/false) if set TRUE, log on console each step		
		},
		
		methods = {
			
			version: function() {
				
				return this.each(function() {
					$(this).html(version);
				});		
			},
			
			init: function( options ) {			
							
				var o = $.extend(defaults, options);
											
				return this.each( function() {
					
					var t = $(this),
						s = $(o.steps+' > '+o.stepHolder),
						tip = $('<div />', { id: "qwikitour-tooltip", class: "qwikitour-tooltip"}),
						overlay = $('<div />', { id: "qwikitour-overlay", class: "qwikitour-overlay"}),
						shield  = $('<div />', { id: "qwikitour-shield", class: "qwikitour-shield"}),
						pg = $('<div />', {id:"qwikitour-messages", class:"qwikitour-messages"}),
                        i = 0
					;
					
					s.hide(); // hide the steps holder
					
					// foreach step found, remove it from the page and store it on the container
					for( i in s ) 
					{

						// only store valid steps
						if ($($(s[i]).data('id')).length || String($(s[i]).data('id')).substring(0,2) == "qw") 
						{
							stepContainer[stepContainer.length] = $(s[i]).clone();
						}					
						$(s[i]).remove();
					}
					
					// create a tooltip box and append it on the body
					$('body')
						.append(overlay.hide())
						.append(shield.hide())
						.append(tip.hide())
						.append(pg.hide())
						;
					
					tip.append( $('<div />', {id:"qwikitour-stepnumber"}) )
					   .append( $('<span/>', {id:"qwikitour-tooltip-nub", class:"qwikitour-tooltip-nub"}) )
					   .append( $('<div />', {id:"qwikitour-button-bar"}) )
					   ;
					   					
					// pageguide content
					pg.append( $('<span />', {id:"qwikitour-index", class:"qwikitour-index"}) )
					  .append( $('<div />', {id:"qwikitour-content", class:"qwikitour-message-text"}) )
					  ;
					  
					
					// define the start point
					stepCurrent = parseInt((o.start || 0), 10);
					
					// when start point is out of range ...
					if (stepCurrent > stepContainer.length || stepCurrent < 0) stepCurrent = 0;
					
					// set trigger's action ...
					t.click(function(e) {
						e.preventDefault();
						
						tourTrigger = t;
						
						if (o.onShow && 'function' == typeof(o.onShow)) 
						{
							o.onShow();
						}
						
						_play(o);
					});
					
					if (o.onStart && 'function' == typeof(o.onStart)) 
					{
						o.onStart();
					}

					if(o.debug) console.log(_getCookie("tour"));
					
					if (o.autoStart || (Number(_getCookie("tour"))==1)) 
					{
						tourTrigger = t;
						
						if(o.debug){
							console.log('autostart');
						}
						
						if (o.onShow && 'function' == typeof(o.onShow)) 
						{
							o.onShow();
						}
						
						_autostart(o); 
					}
					
					// if the autoplay is set, then start
					if (o.autoPlay) 
					{
						
						stepCurrent++;
						_autoplay(o); 
						
					}
					
				} );
				
			} // init
			
		}; // methods
		
		
	function _autostart( options ) 
	{
		_play(options);
	} // _autostart
	
	function _autoplay( options ) 
	{	
		if (stepCurrent < stepContainer.length - 1) 
		{
			setTimeout( function() {
				stepCurrent++;
				_autoplay(options);
			}, options.timer );
		}
		
		_play(options);
	} // _autoplay
	
	// stop the tour
	function _stop(options) 
	{			
		stepCurrent = 0;
		stepShow = 0;
				
		// visual effects 
		$('#qwikitour-tooltip').fadeOut('fast');
		$('#qwikitour-messages').fadeOut('fast');
		$('#qwikitour-overlay, #qwikitour-shield').fadeOut('fast');
		
		// remove any other highlight
		$('.qwikitour-highlight').css('background-color', 'inherit');
		$('.qwikitour-highlight').removeClass('qwikitour-highlight');
		
		// animate to scroll until the element
		// centralize the trigger since it's possible.
		var centerWindow  = Math.ceil($(window).height() / 2),
			triggerOffset = Math.ceil(tourTrigger.offset().top - centerWindow);
		
		$("html, body").animate({scrollTop: triggerOffset}, 'fast');
		
		if (options.onFinish && 'function' == typeof(options.onFinish)) 
		{
			options.onFinish();
		}
	}; // _stop
	
	// says when a object has (or is into an object with) fixed position
	function _isFixed( obj )
	{
		if ($(obj).css('position') == 'fixed') return true;
		if (! $(obj).parent().is('body')) return _isFixed($(obj).parent());
		return false;
		
	} // _isFixed

	// the tour itself
	function _play( options ) 
	{
		var o = options,
			tip = $(stepContainer[stepCurrent]),
			tipPos = null,
			nub = null,
			nubDim = null,
			el = null,
			elPos = null,
			elPosIndex = ['bottom', 'top', 'right', 'left', 'none'],
			me = $('#qwikitour-tooltip'),
			message = $('#qwikitour-messages'),
			tipOffset = null,
			centerWindow = null,
			mytop = 0,
			myleft = 0,
			overlay = $('#qwikitour-overlay, #qwikitour-shield');
			
		// set global tour cookie
		_setCookie("tour",1,1);
		
		// remove any other highlight
		if ( $('.qwikitour-highlight').length && $('.qwikitour-highlight').data('reset-background') )
		{
			$('.qwikitour-highlight').css('background-color', 'inherit');
			$('.qwikitour-highlight').removeData('reset-background');
		}
		
		$('.qwikitour-highlight').removeClass('qwikitour-highlight');
		
		
		// remove clickable elements
		$('.click').css({
			zIndex: 0
		});
		$('.click').removeClass('click');
		
		
		// when there is a callback
		if (o.beforePlay && 'function' == typeof(o.beforePlay)) 
		{
			o.beforePlay(stepCurrent);
		}
		
		if (o.debug) 
		{
			console.log('Current Step: '+(stepCurrent)+' Steps Defined: '+stepContainer.length + 'Steps to Show ' + (stepShow)+ 'Globe ' + _getCookie("tour"));
		}
		
		if ( tip.length ) 
		{
			// get id of the JQueryPlugin elements
			if(tip.data('id') == 'qwtabcontent'){	
				el = $('div[class~=current]');
			}
			else if(tip.data('id').substring(2,5) == 'tab'){	
				
				var ellist = $('ul[class~=jqTabGroup] > li'),
					num = Number(String(tip.data('id')).substring(5,6));

				el = ellist.eq(num-1); // convert to cs count
				
			}
			else if(tip.data('id').substring(2,8) == 'filter'){	
				
				var ellist = $('div[class~=current] table[class~=tablesorter] th'),
					num = Number(String(tip.data('id')).substring(8,9));

				el = ellist.eq(num-1); // convert to cs count
				
			}
			else if(tip.data('id').substring(2,5) == 'new'){	
				
				var ellist = $('div[class=modacSidebarActions] ul li');
				el = ellist.eq(0); // convert to cs count
				
			}			
			else if(tip.data('id').substring(2,9) == 'select2'){	
				var ellist = $('span[class~=select2-container]'),
					num = Number(String(tip.data('id')).substring(10,11));

				el = ellist.eq(num-1); // convert to cs count
				
				el.click(function(){
					var drop = $("span[class='select2-container select2-container--default select2-container--open']");
					drop.addClass('qwikitour-highlight click');	
					drop.css({zIndex: 20000}); // should be in the css file
				});	
			}
			else if(tip.data('id').substring(2,12) == 'texteditor'){	
				var ellist = $("div[class='cke_inner cke_reset']"),
					num = Number(String(tip.data('id')).substring(12,13));

				console.log(ellist.length);
				el = ellist.eq(num-1); // convert to cs count
			}
			else{ // usual case
				el = $(tip.data('id')); // get the element
			}			
			
			if ( el.length ) 
			{
				overlay.fadeIn('fast');
				
				me.fadeOut('fast', function(){	
					
					// define the tooltip position
					tipPos = (tip.data('position') || 'bottom');
					elPos  = el.offset();
					nub    = me.find('#qwikitour-tooltip-nub');
					nubDim = { 
						width: 15, 
						height: nub.outerHeight() > 0 ? nub.outerHeight() : ( Math.abs( nub.height() ))
					};
									
					me.find('#qwikitour-button-bar').remove();
					message.find('#qwikitour-button-finish').remove();
					message.find('#qwikitour-button-next').remove();
					message.find('#qwikitour-button-prev').remove();
					me.find('#qwikitour-tooltip').removeClass('down');
					me.find('#qwikitour-stepnumber').removeClass('down');
										
				
					// avoid shows the tooltip outside browser's work-area
					// if the user has set the wrong side, we fix it ...
					//
					
					//
					// positions are:
					// - none: means that tooltip's nub will be hiden
					// - down: means thet the tooltip will be down on page
					//
					
					me.removeClass('top bottom left right none down');
										
					if (tipPos == 'none')
					{
						// reload the tip content
						me.find('#qwikitour-stepnumber').empty().append(tip.html());
						
						// reload the button bar
						me.append(_button(o,1));
						
						// animate the message dismiss
						message.animate({'height' : '-=100'}, 250, 
							function(){
								message.css({
									display: 'none',
								});
							}
						);
						
						// adjust showSteps if necessary
						if(stepLastElement)stepDummy ? stepShow-- : stepShow++;
						stepLastElement = false;
						
						mytop  = ($(window).height() / 2) - (me.outerHeight() / 2);
						myleft = ($(window).width() / 2) - 219; // wrong calculations if text is wrapping the box -> before (me.outerWidth() / 2);
						
						me.addClass(tipPos); // view for pg welcome
					} // none				
					else if(tipPos == 'down') 
					{
						me.addClass(tipPos);
						
						if(!stepLastElement) message.css({
							display: 'block',
							height: '0px'
						}).animate({'height': '+=100'}, 250);
						
						// adjust showSteps
						stepDummy ? stepShow-- : stepShow++;
						stepLastElement = true;
						
						// load the message box
						me.find('#qwikitour-stepnumber').addClass('down');
						me.find('#qwikitour-stepnumber').empty().append(stepShow);						
						message.find('#qwikitour-index').empty().append(stepShow);
						message.find('#qwikitour-content').empty().append(tip.html());
						message.append(_button(o,0))
						
						console.log(elPos.left);
						console.log(el.outerWidth());
						console.log(nubDim.width);
						
						myleft = elPos.left + el.outerWidth() + ((nubDim.width) / 5 * 4);						
						
						if ( (myleft + me.outerWidth()) > $(window).width()) 
						{
							// if tooltip was placed after the right screen margin, then
							// change tooltip position to left side
							myleft = elPos.left - (nubDim.width / 3 * 2) - me.outerWidth();
							tipPos = 'left';
						} 
						else{
							tipPos = 'right';
						}
						// add -> adjust to top and down, if left and right out of screen
					} // down
					
					nub.removeAttr('style');
					nub.removeClass('top bottom left right none');
					nub.addClass(tipPos);
					
					
					switch(elPosIndex.indexOf(tipPos)) 
					{
						case 1 : // top
							
							me.css({
								display: 'block',
								top: mytop - 10,
								left: elPos.left + (el.outerWidth()/2) - (me.outerWidth()/2)
							}).animate({'top': '+=10'}, 150 );
							
							//nub.css({ left: Math.ceil(me.outerWidth()/2) });
	
							break;
							
						case 2 : // right

							me.css({
								display: 'block',
								top: (elPos.top), 
								left: myleft + 10
							}).animate({'left': '-=10'}, 150);
							
							nub.css({ 
								top: -1
							});
							
							break;
							
						case 3 : // left
							
							me.css({
								display: 'block',
								top: (elPos.top), 
								left: myleft - 10
							}).animate({'left': '+=10'}, 150);
							
							nub.css({ 
								top: -1, 
								left: me.outerWidth()
							});

							
							break;
							
						case 4 : // none
							
							me.css({
								display: 'block',
								top: mytop, // - 10,
								left: myleft
							});
							
							nub.css('display', 'none');
													
							break;
							
						default: // bottom
						
							me.css({
								display: 'block',
								top: mytop + 10,
								left: elPos.left + (el.outerWidth()/2) - (me.outerWidth()/2)
							}).animate({'top': '-=10'}, 150);
						
						
							// nub.css({ left: Math.ceil((me.outerWidth()/2) - (nub.outerWidth()/2)) });
						
							break;
					}
					
					//
					// adjust left|right position if the tooltip is placed as 'top' | 'bottom' and
					// it goes over the limits of browser's work-area
					//
					
					// if (tipPos == 'top' || tipPos == 'bottom') 
					// {
						// var diff = Math.ceil( me.offset().left + me.outerWidth() - $(window).width() );

						// if (diff > 0) 
						// {
							// me.css({left: me.offset().left - diff});
							// nub.css({left: diff + parseInt(nub.css('left'), 10) + 20});
						// }
					// }
					
					if (! _isFixed(el))
					{
						// animate to scroll until the element
						centerWindow = Math.ceil($(window).height() / 2);
						tipOffset = Math.ceil(me.offset().top - centerWindow);
						
						$("html, body").animate({scrollTop: tipOffset}, 'slow');
					}
					
					// add highlighting of the selected element
					if (tipPos != 'none')
					{
						el.addClass('qwikitour-highlight');

						if ( el.css('background-color') == 'rgba(0, 0, 0, 0)' || el.css('background-color') == 'transparent' )
						{
							el.data('reset-background', true);
							el.css('background-color', 'rgba(255, 255, 255, 1)');
						}
						
						
						if ( tip.data('action') == 'click' ){
							
							_clickable(el);
							
							if(stepCurrent >= stepContainer.length - 1){
								el.click(function(){
									$('#qwikitour-button-finish').click();
								});
							}
						}
					}
			
					
					me.fadeIn('fast');
					
				}); // me.fadeIn
			}
			else // !el.length 
			{ 
				// get to next or stop
				if(stepCurrent < stepContainer.length - 2){
					stepCurrent += 1;
					_play(o);
				}
				else{
					console.log("element of the last step does not exist");
					_stop(o);
				}
				
			}
		}  // tip.length
			
		if (o.afterPlay && 'function' == typeof(o.afterPlay)) 
		{
			o.afterPlay(stepCurrent);
		}
	}; // _play
	
	function _clickable ( element )
	{
		element.css({
			zIndex: 20000
		});
		element.addClass('click');
	}; // _clickable
	
	function _highlighting ( element )
	{
		element.addClass('qwikitour-highlight');
	}; // _highlighting
	
	function _getCookie ( element )
	{
		var name = element + "=";
		var varlist = document.cookie.split(';');
		for(var i=0; i<varlist.length; i++) {
			var v = varlist[i];
			while (v.charAt(0)==' ') v = v.substring(1);
			if (v.indexOf(name) == 0) return v.substring(name.length, v.length);
		}
		return "";
	}; // _getCookie
	
	function _setCookie( element, value, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+d.toUTCString();
		document.cookie = element + "=" + value + "; " + expires + "; path=/";
	}
	
	// Load the buttons behavior
	function _button( options, none ) 
	{
		var o 		= options,
			prev   	= $('<a href="#" id="qwikitour-button-prev" class="qwikitour-button-prev" title="Previous"></a>'),
			next 	= $('<a href="#" id="qwikitour-button-next" class="qwikitour-button-next" title="Next"></a>'),
			start  	= $('<a href="#" id="qwikitour-button-start"></a>'),
			finish 	= $('<a href="#" id="qwikitour-button-finish" class="qwikitour-button-finish" title="Close Guide"></a>');
		
		
		if (none){
			var	steps  = $('<select id="my-tour-dropdown-steps" ></select>'),
				div	   = $('<div id="qwikitour-button-bar" ></div>');
		}
		else{	
			var	div	   = $('#qwikitour-messages');
		}
		
		// setup the start button behavior
		if (!o.autoPlay && o.buttons.start && none)
		{
			if (stepCurrent > 0)
			{
				start.click(function(e){
					e.preventDefault();
					stepCurrent = 0;
					stepShow = 0;
					stepDummy = false;
					stepLastElement = false;
					_play(o);
				});
			}
			else 
			{
				start.click(function(e){ e.preventDefault(); })
					 .addClass('disabled');
			}
			
			start.html(o.buttons.start)
				 .appendTo(div);
		}
		
		// setup the previous button behavior
		if (!o.autoPlay && o.buttons.prev)
		{
			if (stepCurrent > 0)
			{
				prev.click(function(e) {
					e.preventDefault();
					stepCurrent -= 1;
					stepDummy = true;
					_play( o );
				});
			}
			else
			{
				prev.click(function(e){ e.preventDefault(); })
					.addClass('disabled');
			}
			
			prev.html(o.buttons.prev)
				.appendTo(div);
		}
		
		// setup the next button behavior
		if (!o.autoPlay && o.buttons.next)
		{
			if (stepCurrent >= stepContainer.length - 1)
			{
				next.click(function(e){ e.preventDefault(); })
					.addClass('disabled');
			}
			else
			{
				next.click(function(e){
					e.preventDefault();
					stepCurrent += 1;
					stepDummy = false;
					_play( o );
				});
			}		
			
			next.html(o.buttons.next)
				.appendTo(div);
		}
		
		
		// setup the finish button behavior
		if ((!o.autoPlay && o.buttons.finish) ||
			(o.buttons.finish && stepCurrent >= stepContainer.length - 1))
		{
			finish.html(o.buttons.finish)
				  .appendTo(div);
			
			finish.click(function(e){
				e.preventDefault();
				(stepCurrent >= stepContainer.length - 1) ? _setCookie("tour",1,1 ) : _setCookie("tour",0,1 );
				stepCurrent = 0; // reset
				stepShow = 0;
				stepDummy = false;
				stepLastElement = false;
				_stop(o);
			});
		}

		// steps dropdown box
		if (!o.autoPlay && o.buttons.menu && none)
		{
			var i = 0,
				j = i+1;
			
			for(i in stepContainer)
			{
				if ($(stepContainer[i].data('id')).length)
				{
					steps.append(
						'<option value="'+(i)+'" '
						+(stepCurrent == i ? 'selected="selected"' : '')+' >'
						+(j++)+'</option>'
					);
				}
			}
			
			steps.change(function(){
				stepCurrent = parseInt(this.value, 10);
				_play(o);
			}).appendTo(div);
		}
		
		if(none)return div;
	};	
	
	$.fn.qwikitour = function( method ) 
	{
		if (methods[method]) 
		{
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} 
		else if ( typeof method === 'object' || ! method ) 
		{
			return methods.init.apply( this, arguments );
		} 
		else 
		{
			$.error( 'Method ' +  method + ' does not exist on jQuery.qwikitour()' );
		}
	};
	
})(jQuery);