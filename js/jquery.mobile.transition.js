//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
//>>description: Animated page change core logic and sequence handlers
//>>label: Transition Core
//>>group: Transitions
//>>css.structure: ../css/structure/jquery.mobile.transition.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

define( [ "jquery", "./jquery.mobile.core" ], function( jQuery ) {
//>>excludeEnd("jqmBuildExclude");
(function( $, window, undefined ) {

	$.mobile.Transition = function() {
		this.init.apply(this, arguments);
	};

	$.extend($.mobile.Transition.prototype, {
		init: function( name, reverse, $to, $from ) {
			$.extend(this, {
				name: name,
				reverse: reverse,
				$to: $to,
				$from: $from
			});
		},

		cleanFrom: function( $from ) {
			$from
				.removeClass( $.mobile.activePageClass + " out in reverse " + this.name )
				.height( "" );
		},

		doneIn: function( $from, $to, toScroll, deferred ) {
				if ( !this.sequential ) {

					if ( $from ) {
						this.cleanFrom( $from );
					}
				}

				$to.removeClass( "out in reverse " + this.name ).height( "" );

				this.toggleViewportClass();

				// In some browsers (iOS5), 3D transitions block the ability to scroll to the desired location during transition
				// This ensures we jump to that spot after the fact, if we aren't there already.
				if ( $.mobile.window.scrollTop() !== toScroll ) {
					this.scrollPage( toScroll );
				}

			deferred.resolve( this.name, this.reverse, $to, $from, true );
		},

		doneOut: function( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none ) {

			if ( $from && this.sequential ) {
				this.cleanFrom( $from );
			}

			this.startIn( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none );
		},

		scrollPage: function( toScroll ) {
			// By using scrollTo instead of silentScroll, we can keep things better in order
			// Just to be precautios, disable scrollstart listening like silentScroll would
			$.event.special.scrollstart.enabled = false;

			window.scrollTo( 0, toScroll );

			// reenable scrollstart listening like silentScroll would
			setTimeout( function() {
				$.event.special.scrollstart.enabled = true;
			}, 150 );
		},

		startIn: function( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none ) {


			// Prevent flickering in phonegap container: see comments at #4024 regarding iOS
			$to.css( "z-index", -10 );

			$to.addClass( $.mobile.activePageClass + toPreClass );

			// Send focus to page as it is now display: block
			$.mobile.focusPage( $to );

			// Set to page height
			$to.height( screenHeight + toScroll );

			this.scrollPage( toScroll );

			// Restores visibility of the new page: added together with $to.css( "z-index", -10 );
			$to.css( "z-index", "" );

			if ( !none ) {
				$to.animationComplete( $.proxy(function() {
					this.doneIn( $from, $to, toScroll, deferred );
				}, this));
			}

			$to
				.removeClass( toPreClass )
				.addClass( this.name + " in" + reverseClass );

			if ( none ) {
				this.doneIn( $from, $to, toScroll, deferred );
			}

		},

		startOut: function( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none ) {
			// if it's not sequential, call the doneOut transition to start the TO page animating in simultaneously
			if ( !this.sequential ) {
				this.doneOut( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none );
			} else {
				$from.animationComplete($.proxy(function() {
					this.doneOut( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none );
				}, this));
			}

			// Set the from page's height and start it transitioning out
			// Note: setting an explicit height helps eliminate tiling in the transitions
			$from
				.height( screenHeight + $.mobile.window.scrollTop() )
				.addClass( this.name + " out" + reverseClass );
		},


		toggleViewportClass: function() {
				$.mobile.pageContainer.toggleClass( "ui-mobile-viewport-transitioning viewport-" + this.name );
		},

		transition: function( $to, $from ) {
			// TODO temporary
			var self = this;

			var deferred = new $.Deferred(),
				reverseClass = this.reverse ? " reverse" : "",
				active	= $.mobile.urlHistory.getActive(),
				toScroll = active.lastScroll || $.mobile.defaultHomeScroll,
				screenHeight = $.mobile.getScreenHeight(),
				maxTransitionOverride = $.mobile.maxTransitionWidth !== false && $.mobile.window.width() > $.mobile.maxTransitionWidth,
				none = !$.support.cssTransitions || maxTransitionOverride || !this.name || this.name === "none" || Math.max( $.mobile.window.scrollTop(), toScroll ) > $.mobile.getMaxScrollForTransition(),
				toPreClass = " ui-page-pre-in";


			this.toggleViewportClass();

			if ( $from && !none ) {
				this.startOut( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none );
			} else {
				this.doneOut( $from, $to, toScroll, deferred, toPreClass, screenHeight, reverseClass, none );
			}

			return deferred.promise();
		}
	});


	$.mobile.SerialTransition = function(){
		this.init.apply(this, arguments);
	};

	$.extend($.mobile.SerialTransition.prototype, $.mobile.Transition.prototype, {
		sequential: true
	});

	$.mobile.ConcurentTransition = function(){
		this.init.apply(this, arguments);
	};

	$.extend($.mobile.ConcurentTransition.prototype, $.mobile.Transition.prototype, {
		sequential: false
	});



// generate the handlers from the above
var sequentialHandler = $.mobile.SerialTransition,
	simultaneousHandler = $.mobile.ConcurentTransition,
	defaultGetMaxScrollForTransition = function() {
		return $.mobile.getScreenHeight() * 3;
	};

// Make our transition handler the public default.
$.mobile.defaultTransitionHandler = sequentialHandler;

//transition handler dictionary for 3rd party transitions
$.mobile.transitionHandlers = {
	"default": $.mobile.defaultTransitionHandler,
	"sequential": sequentialHandler,
	"simultaneous": simultaneousHandler
};

$.mobile.transitionFallbacks = {};

// If transition is defined, check if css 3D transforms are supported, and if not, if a fallback is specified
$.mobile._maybeDegradeTransition = function( transition ) {
		if ( transition && !$.support.cssTransform3d && $.mobile.transitionFallbacks[ transition ] ) {
			transition = $.mobile.transitionFallbacks[ transition ];
		}

		return transition;
};

// Set the getMaxScrollForTransition to default if no implementation was set by user
$.mobile.getMaxScrollForTransition = $.mobile.getMaxScrollForTransition || defaultGetMaxScrollForTransition;
})( jQuery, this );
//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
});
//>>excludeEnd("jqmBuildExclude");
